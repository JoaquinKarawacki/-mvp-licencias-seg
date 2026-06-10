import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaServicio } from '../../../prisma/prisma.servicio';

@Injectable()
export class SaldosServicio {
  constructor(private readonly prisma: PrismaServicio) {}



  private calcularAntiguedad(fechaIngreso: Date, anio: number): number {
  // años de calendario entre el ingreso y el año del saldo
  let anios = anio - fechaIngreso.getFullYear();

  // ¿el empleado ya había cumplido aniversario al 1 de enero de "anio"?
  // el ingreso es el 1 de enero solo si entró en enero (mes 0) y día 1
  const ingresoEsPrimeroDeEnero =
    fechaIngreso.getMonth() === 0 && fechaIngreso.getDate() === 1;

  // si NO entró un 1 de enero, al 1/1 todavía no cumplió aniversario → resto 1
  if (!ingresoEsPrimeroDeEnero) {
    anios = anios - 1;
  }

  return anios;
 }

 private calcularDiasExtra(antiguedad: number): number {
  if (antiguedad < 5) {
    return 0;
  }
  return 1 + Math.floor((antiguedad - 5) / 4);
}

 private calcularDiasCorrespondientes(fechaIngreso: Date, anio: number): number {
  const antiguedad = this.calcularAntiguedad(fechaIngreso, anio);
  const diasExtra = this.calcularDiasExtra(antiguedad);

  if (antiguedad >= 1) {
    // Año completo: 20 días fijos + extras por antigüedad (sin decimales posibles)
    return 20 + diasExtra;
  }

  // --- Proporcional: el empleado tiene menos de un año ---

  // OJO: usar getUTC* para evitar el corrimiento por UTC-3
  const mesIngreso = fechaIngreso.getUTCMonth(); // 0 = enero, 11 = diciembre
  const diaIngreso = fechaIngreso.getUTCDate();  // 1-31

  // ¿El mes de ingreso cuenta? Solo si trabajó ≥18 días (base 30, no días reales)
  // Ej: entró el 13 → 30 - 13 + 1 = 18 ✅  |  entró el 14 → 17 ❌
  const diasEnMesIngreso = 30 - diaIngreso + 1;
  const mesIngresoContado = diasEnMesIngreso >= 18 ? 1 : 0;

  // Meses completos posteriores al de ingreso hasta diciembre (siempre cuentan)
  // Ej: ingresó en marzo (mes 2) → abril a diciembre = 12 - 2 - 1 = 9 meses
  const mesesPosteriores = 12 - mesIngreso - 1;

  const totalMeses = mesIngresoContado + mesesPosteriores;
  const diasAcumulados = totalMeses * (20 / 12);

  // Regla RRHH: si acumulaste algo (> 0), mínimo 1 día tomable
  return diasAcumulados > 0 ? Math.max(1, Math.floor(diasAcumulados)) : 0;
}

 private calcularDiasEstudio(horasSemanales: number): number {
  if (horasSemanales <= 36) {
    return 6;
  }
  if (horasSemanales < 48) {
    return 9;
  }
  return 12;
}

async generarSaldo(empleadoId: number, tipoLicenciaId: number, anio: number) {
  const empleado = await this.prisma.empleado.findUnique({
    where: { id: empleadoId },
  });
  if (!empleado) {
    throw new NotFoundException('El empleado no existe');
  }

  // Buscamos el tipo de licencia para conocer su código
  const tipoLicencia = await this.prisma.tipoLicencia.findUnique({
    where: { id: tipoLicenciaId },
  });
  if (!tipoLicencia) {
    throw new NotFoundException('El tipo de licencia no existe');
  }

  let totalDias: number;

  if (tipoLicencia.codigo === 'ESTUDIO') {
    // Solo los estudiantes tienen saldo de estudio
    if (!empleado.es_estudiante) {
      throw new ConflictException(
        'No se puede generar saldo de estudio para un empleado que no es estudiante',
      );
    }
    totalDias = this.calcularDiasEstudio(empleado.horas_semanales);
  } else {
    // NORMAL: lógica por antigüedad de siempre
    totalDias = this.calcularDiasCorrespondientes(empleado.fecha_ingreso, anio);
  }

  return this.prisma.saldoLicencia.upsert({
    where: {
      empleado_id_tipo_licencia_id_anio: {
        empleado_id: empleadoId,
        tipo_licencia_id: tipoLicenciaId,
        anio,
      },
    },
    update: { total_dias: totalDias },
    create: {
      empleado_id: empleadoId,
      tipo_licencia_id: tipoLicenciaId,
      anio,
      total_dias: totalDias,
    },
  });
}

 async verMiSaldo(usuarioId: number, anio: number) {
  const empleado = await this.prisma.empleado.findUnique({
    where: { usuario_id: usuarioId },
  });
  if (!empleado) {
    throw new NotFoundException('El empleado no existe');
  }

  const saldos = await this.prisma.saldoLicencia.findMany({
    where: { empleado_id: empleado.id, anio },
    include: { tipo_licencia: true },
  });

  return saldos.map((saldo) => ({
    ...saldo,
    disponible: saldo.total_dias + saldo.dias_ajustados - saldo.dias_usados,
  }));
}

 async ajustarSaldo(
  empleadoId: number,
  tipoLicenciaId: number,
  anio: number,
  dias: number,
) {
  const saldo = await this.prisma.saldoLicencia.findUnique({
    where: {
      empleado_id_tipo_licencia_id_anio: {
        empleado_id: empleadoId,
        tipo_licencia_id: tipoLicenciaId,
        anio,
      },
    },
  });
  if (!saldo) {
    throw new NotFoundException('No existe un saldo para ese empleado, tipo y año');
  }

  return this.prisma.saldoLicencia.update({
    where: { id: saldo.id },
    data: {
      dias_ajustados: saldo.dias_ajustados + dias,
    },
  });
}
 
 async descontarSaldo(
  empleadoId: number,
  tipoLicenciaId: number,
  anio: number,
  dias: number,
) {
  let saldo = await this.prisma.saldoLicencia.findUnique({
    where: {
      empleado_id_tipo_licencia_id_anio: {
        empleado_id: empleadoId,
        tipo_licencia_id: tipoLicenciaId,
        anio,
      },
    },
  });

  // si no existe, lo genero automáticamente
  if (!saldo) {
    saldo = await this.generarSaldo(empleadoId, tipoLicenciaId, anio);
  }

  return this.prisma.saldoLicencia.update({
    where: { id: saldo.id },
    data: {
      dias_usados: saldo.dias_usados + dias,
    },
  });
}


}