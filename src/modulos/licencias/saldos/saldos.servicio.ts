import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaServicio } from '../../../prisma/prisma.servicio';
import { AuditoriaServicio } from '../../auditoria/auditoria.servicio';

@Injectable()
export class SaldosServicio {
   constructor(
    private readonly prisma: PrismaServicio,
    private readonly auditoria: AuditoriaServicio,
  ) {}



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

async generarSaldo(
  empleadoId: number,
  tipoLicenciaId: number,
  anio: number,
  usuarioId?: number,
  usuarioEmail?: string,
) {
  const empleado = await this.prisma.empleado.findUnique({
    where: { id: empleadoId },
  });
  if (!empleado) {
    throw new NotFoundException('El empleado no existe');
  }

  const tipoLicencia = await this.prisma.tipoLicencia.findUnique({
    where: { id: tipoLicenciaId },
  });
  if (!tipoLicencia) {
    throw new NotFoundException('El tipo de licencia no existe');
  }

  let totalDias: number;

  if (tipoLicencia.codigo === 'ESTUDIO') {
    if (!empleado.es_estudiante) {
      throw new ConflictException(
        'No se puede generar saldo de estudio para un empleado que no es estudiante',
      );
    }
    totalDias = this.calcularDiasEstudio(empleado.horas_semanales);
  } else {
    totalDias = this.calcularDiasCorrespondientes(empleado.fecha_ingreso, anio);
  }

  const saldo = await this.prisma.saldoLicencia.upsert({
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

  // Solo auditamos si vino un usuario (o sea, lo llamó un admin, no descontarSaldo)
  if (usuarioEmail) {
    await this.auditoria.registrar({
      usuario_id: usuarioId ?? null,
      usuario_email: usuarioEmail,
      accion: 'SALDO_GENERADO',
      descripcion: `Generó saldo de ${tipoLicencia.nombre} para ${empleado.nombre} ${empleado.apellido} (${anio}): ${totalDias} días`,
      entidad: 'SALDO',
      entidad_id: saldo.id,
    });
  }

  return saldo;
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
  usuarioId: number,
  usuarioEmail: string,
) {
  const saldo = await this.prisma.saldoLicencia.findUnique({
    where: {
      empleado_id_tipo_licencia_id_anio: {
        empleado_id: empleadoId,
        tipo_licencia_id: tipoLicenciaId,
        anio,
      },
    },
    include: { empleado: true, tipo_licencia: true },
  });
  if (!saldo) {
    throw new NotFoundException('No existe un saldo para ese empleado, tipo y año');
  }

  const actualizado = await this.prisma.saldoLicencia.update({
    where: { id: saldo.id },
    data: {
      dias_ajustados: saldo.dias_ajustados + dias,
    },
  });

  await this.auditoria.registrar({
    usuario_id: usuarioId,
    usuario_email: usuarioEmail,
    accion: 'SALDO_AJUSTADO',
    descripcion: `Ajustó el saldo de ${saldo.tipo_licencia.nombre} de ${saldo.empleado.nombre} ${saldo.empleado.apellido} (${anio}) en ${dias >= 0 ? '+' : ''}${dias} días`,
    entidad: 'SALDO',
    entidad_id: saldo.id,
  });

  return actualizado;
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

async verSaldoEmpleado(empleadoId: number, anio: number) {
  const empleado = await this.prisma.empleado.findUnique({
    where: { id: empleadoId },
  });
  if (!empleado) {
    throw new NotFoundException('El empleado no existe');
  }

  const saldos = await this.prisma.saldoLicencia.findMany({
    where: { empleado_id: empleadoId, anio },
    include: { tipo_licencia: true },
  });

  return saldos.map((saldo) => ({
    ...saldo,
    disponible: saldo.total_dias + saldo.dias_ajustados - saldo.dias_usados,
  }));
}

async verTodosLosSaldos(anio: number) {
  const empleados = await this.prisma.empleado.findMany({
    include: {
      sector: true,
      saldos: {
        where: { anio },
        include: { tipo_licencia: true },
      },
    },
    orderBy: [
      { apellido: 'asc' },
      { nombre: 'asc' },
    ],
  });

  return empleados.map((empleado) => ({
    id: empleado.id,
    nombre: empleado.nombre,
    apellido: empleado.apellido,
    sector: empleado.sector,
    saldos: empleado.saldos.map((saldo) => ({
      ...saldo,
      disponible: saldo.total_dias + saldo.dias_ajustados - saldo.dias_usados,
    })),
  }));
}

async verSaldosEquipo(usuarioId: number, anio: number) {
  const empleado = await this.prisma.empleado.findUnique({
    where: { usuario_id: usuarioId },
  });
  if (!empleado) {
    throw new NotFoundException('El empleado no existe');
  }

  const tieneSubordinados = await this.prisma.empleado.findFirst({
    where: { aprobador_id: empleado.id },
  });

  const incluye = {
    sector: true,
    saldos: { where: { anio }, include: { tipo_licencia: true } },
  };

  // Todo el sector (a diferencia de verPendientes, acá SÍ incluye a los que
  // tienen aprobador_id propio: esto es "quién pertenece a mi sector", no
  // ruteo de aprobación).
  const miembrosDeSector = empleado.es_encargado
    ? await this.prisma.empleado.findMany({
        where: { sector_id: empleado.sector_id, esta_activo: true },
        include: incluye,
      })
    : [];

  // Subordinados puntuales (caso dueño), puedan o no compartir sector.
  const subordinados = tieneSubordinados
    ? await this.prisma.empleado.findMany({
        where: { aprobador_id: empleado.id, esta_activo: true },
        include: incluye,
      })
    : [];

  const combinados = [...miembrosDeSector];
  for (const sub of subordinados) {
    if (!combinados.some((e) => e.id === sub.id)) combinados.push(sub);
  }
  combinados.sort(
    (a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre),
  );

  return combinados.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    apellido: e.apellido,
    sector: e.sector,
    saldos: e.saldos.map((s) => ({
      ...s,
      disponible: s.total_dias + s.dias_ajustados - s.dias_usados,
    })),
  }));
}

}