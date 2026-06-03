import { Injectable, NotFoundException } from '@nestjs/common';
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

  let diasBase: number;

  if (antiguedad >= 1) {
    diasBase = 20;
  } else {
    // proporcional: entró durante "anio" (o el anterior sin cumplir el año)
    // meses trabajados en el año × 1.66
    // pista: si entró en "anio", los meses son (12 - mes de ingreso)
    //        getMonth() da 0-11, entonces meses = 12 - fechaIngreso.getMonth()
    const mesesTrabajados = 12 - fechaIngreso.getMonth();
    diasBase = mesesTrabajados * 1.66;
  }

  const diasExtra = this.calcularDiasExtra(antiguedad);

  return diasBase + diasExtra;  
 }

 async generarSaldo(empleadoId: number, tipoLicenciaId: number, anio: number) {
  const empleado = await this.prisma.empleado.findUnique({
    where: { id: empleadoId },
  });
  if (!empleado) {
    throw new NotFoundException('El empleado no existe');
  }

  const totalDias = this.calcularDiasCorrespondientes(empleado.fecha_ingreso, anio);

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