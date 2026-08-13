import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaServicio } from '../../../prisma/prisma.servicio';
import { CalculadorServicio } from '../calculador/calculador.servicio';
import { CrearSolicitudLicenciaDto } from './dto/crear-solicitud.dto';
import { SaldosServicio } from '../saldos/saldos.servicio';
import { NotificacionesServicio } from '../../notificaciones/notificaciones.servicio';
import { AuditoriaServicio } from '../../auditoria/auditoria.servicio';

@Injectable()
export class SolicitudesServicio {
  constructor(
    private readonly prisma: PrismaServicio,
    private readonly calculador: CalculadorServicio,
    private readonly saldos: SaldosServicio,
    private readonly notificaciones: NotificacionesServicio,
    private readonly auditoria: AuditoriaServicio,
  ) {}

    // Un empleado con aprobador puntual (los encargados) solo puede ser
    // revisado por ese aprobador. Sin aprobador puntual, rige la regla de
    // siempre: cualquier encargado activo de su mismo sector.
    private puedeRevisar(
        quienRevisa: { id: number; es_encargado: boolean; sector_id: number },
        solicitante: { sector_id: number; aprobador_id: number | null },
    ): boolean {
        if (solicitante.aprobador_id) {
            return solicitante.aprobador_id === quienRevisa.id;
        }
        return quienRevisa.es_encargado && quienRevisa.sector_id === solicitante.sector_id;
    }

    // Separa un array de fechas (ya ordenado) en tramos de dias consecutivos.
    // Ej: [13,14,15,16,17,20,21,22] -> [[13..17], [20,21,22]]
    private agruparConsecutivos(fechas: Date[]): Date[][] {
        const unDiaMs = 24 * 60 * 60 * 1000;
        const grupos: Date[][] = [[fechas[0]]];

        for (let i = 1; i < fechas.length; i++) {
            const esConsecutivo = fechas[i].getTime() - fechas[i - 1].getTime() === unDiaMs;
            if (esConsecutivo) {
                grupos[grupos.length - 1].push(fechas[i]);
            } else {
                grupos.push([fechas[i]]);
            }
        }

        return grupos;
    }

    // Da formato a los dias de una solicitud para mails/UI, tramo por tramo:
    // - Cada tramo de MAS de 3 dias consecutivos -> rango: "13/07/2026 al 17/07/2026"
    // - Tramos cortos o dias sueltos -> se listan uno por uno
    // - Los tramos se combinan en un solo texto, ej:
    //   "13/07/2026 al 17/07/2026, 20/07/2026, 21/07/2026 y 22/07/2026"
    private formatearDias(dias: { fecha: Date }[]): string {
        const fechas = dias.map((d) => d.fecha).sort((a, b) => a.getTime() - b.getTime());

        const formatear = (fecha: Date) => {
            const [anio, mes, dia] = fecha.toISOString().split('T')[0].split('-');
            return `${dia}/${mes}/${anio}`;
        };

        const grupos = this.agruparConsecutivos(fechas);

        const segmentos = grupos.flatMap((grupo) => {
            if (grupo.length > 3) {
                return [`${formatear(grupo[0])} al ${formatear(grupo[grupo.length - 1])}`];
            }
            return grupo.map(formatear);
        });

        if (segmentos.length === 1) return segmentos[0];
        return `${segmentos.slice(0, -1).join(', ')} y ${segmentos[segmentos.length - 1]}`;
    }

    // Encuentra quien debe enterarse de los movimientos de un empleado: su
    // aprobador puntual si tiene uno cargado (encargados), o si no, el
    // encargado activo de su sector.
    private async buscarRevisor(empleado: { id: number; sector_id: number; aprobador_id: number | null }) {
        return empleado.aprobador_id
            ? this.prisma.empleado.findUnique({
                where: { id: empleado.aprobador_id },
                include: { usuario: true },
            })
            : this.prisma.empleado.findFirst({
                where: {
                    sector_id: empleado.sector_id,
                    es_encargado: true,
                    esta_activo: true,
                    id: { not: empleado.id },
                },
                include: { usuario: true },
            });
    }

    async crear(usuarioId: number, crearSolicitudLicenciaDto: CrearSolicitudLicenciaDto) {
        
        // 1. Buscar el empleado a partir del usuario del token
        const empleado = await this.prisma.empleado.findUnique({
            where: { usuario_id: usuarioId },
            include: { usuario: true },
        });
        if (!empleado) {
            throw new NotFoundException('El empleado no existe');
        }

        // 2. Verificar que el tipo de licencia existe
        const tipoLicencia = await this.prisma.tipoLicencia.findUnique({
            where: { id: crearSolicitudLicenciaDto.tipo_licencia_id },
        });
        if (!tipoLicencia) {
            throw new NotFoundException('El tipo de licencia no existe');
        }

        // 3. Validar solapamiento de días
        const fechasPedidas = crearSolicitudLicenciaDto.dias.map((f) => new Date(f));

        const diaSolapado = await this.prisma.diaSolicitado.findFirst({
            where: {
            fecha: { in: fechasPedidas },
            solicitud: {
                empleado_id: empleado.id,
                estado: { in: ['PENDIENTE', 'APROBADA'] },
            },
            },
        });
        if (diaSolapado) {
            throw new ConflictException('Ya tenés una solicitud que incluye alguno de esos días');
        }

        // 4. Traer los feriados
        const feriados = await this.prisma.feriado.findMany();

        // 5. Calcular los días a descontar
        const diasDescontados = this.calculador.calcularDias(
            crearSolicitudLicenciaDto.dias,
            feriados.map((f) => f.fecha),
            empleado.aplica_regla_sabado,
        );

         // 6. Crear la solicitud + sus días en una sola operación
        const solicitud = await this.prisma.solicitudLicencia.create({
            data: {
                empleado_id: empleado.id,
                tipo_licencia_id: crearSolicitudLicenciaDto.tipo_licencia_id,
                dias_descontados: diasDescontados,
                comentario: crearSolicitudLicenciaDto.comentario,
                estado: 'PENDIENTE',
                dias: {
                    create: fechasPedidas.map((fecha) => ({ fecha })),
                },
            },
            include: {
                dias: true,
            },
        });

        // Si el empleado tiene un aprobador puntual (caso de los encargados, que
        // no pueden autoaprobarse), la notificación va para esa persona.
        // Si no, va para el encargado del sector (regla de siempre).
        const revisor = await this.buscarRevisor(empleado);

        if (revisor) {
            // No se espera el envío del correo: no debe demorar la respuesta al empleado.
            void this.notificaciones.notificarNuevaSolicitud(
                revisor.usuario.email,
                `${empleado.nombre} ${empleado.apellido}`,
                diasDescontados,
            );
        }

        await this.auditoria.registrar({
            usuario_id: empleado.usuario.id,
            usuario_email: empleado.usuario.email,
            accion: 'SOLICITUD_CREADA',
            descripcion: `Pidió licencia (${tipoLicencia.nombre}), ${diasDescontados} días`,
            entidad: 'SOLICITUD',
            entidad_id: solicitud.id,
        });

        return solicitud;
    }

    async verMias(usuarioId: number) {
        const empleado = await this.prisma.empleado.findUnique({
            where: { usuario_id: usuarioId },
        });
        if (!empleado) {
            throw new NotFoundException('El empleado no existe');
        }

        return this.prisma.solicitudLicencia.findMany({
            where: { empleado_id: empleado.id },
            include: { dias: true, tipo_licencia: true },
            orderBy: { fecha_creacion: 'desc' },
        });
    }

    async verPendientes(usuarioId: number) {

        const empleado = await this.prisma.empleado.findUnique({
            where: { usuario_id: usuarioId },
        });
        if (!empleado) {
            throw new NotFoundException('El empleado no existe');
        }

        const tieneSubordinados = await this.prisma.empleado.findFirst({
            where: { aprobador_id: empleado.id },
        });

        if (!empleado.es_encargado && !tieneSubordinados) {
            throw new ForbiddenException('No tenés permisos para ver solicitudes pendientes');
        }

        const incluye = { dias: true, tipo_licencia: true, empleado: true };

        // Pendientes del sector: solo las de empleados que NO tienen un aprobador
        // puntual (esas se resuelven aparte, para que un encargado no vea ni
        // pueda tocar su propia solicitud).
        const pendientesDeSector = empleado.es_encargado
            ? await this.prisma.solicitudLicencia.findMany({
                where: {
                    estado: 'PENDIENTE',
                    empleado: { sector_id: empleado.sector_id, aprobador_id: null },
                },
                include: incluye,
            })
            : [];

        // Pendientes de quienes tienen a este empleado como aprobador puntual
        // (caso de los encargados, que responden ante un nivel más arriba).
        const pendientesComoAprobador = tieneSubordinados
            ? await this.prisma.solicitudLicencia.findMany({
                where: {
                    estado: 'PENDIENTE',
                    empleado: { aprobador_id: empleado.id },
                },
                include: incluye,
            })
            : [];

        return [...pendientesDeSector, ...pendientesComoAprobador].sort(
            (a, b) => a.fecha_creacion.getTime() - b.fecha_creacion.getTime(),
        );
    }

    async verHistorialEmpleado(usuarioId: number, empleadoId: number) {
        const quienConsulta = await this.prisma.empleado.findUnique({
            where: { usuario_id: usuarioId },
            include: { usuario: true },
        });
        if (!quienConsulta) {
            throw new NotFoundException('El empleado no existe');
        }

        const empleadoObjetivo = await this.prisma.empleado.findUnique({
            where: { id: empleadoId },
            include: { sector: true },
        });
        if (!empleadoObjetivo) {
            throw new NotFoundException('El empleado no existe');
        }

        const esAdmin = quienConsulta.usuario.rol === 'ADMIN';
        if (!esAdmin && !this.puedeRevisar(quienConsulta, empleadoObjetivo)) {
            throw new ForbiddenException('No tenés permisos para ver el historial de este empleado');
        }

        const solicitudes = await this.prisma.solicitudLicencia.findMany({
            where: { empleado_id: empleadoId },
            include: {
                dias: { orderBy: { fecha: 'asc' } },
                tipo_licencia: true,
            },
            orderBy: { fecha_creacion: 'desc' },
        });

        return {
            empleado: {
                id: empleadoObjetivo.id,
                nombre: empleadoObjetivo.nombre,
                apellido: empleadoObjetivo.apellido,
                sector: empleadoObjetivo.sector?.nombre ?? null,
            },
            solicitudes,
        };
    }

    async aprobar(usuarioId: number, solicitudId: number) {
        // 1. Buscar quien revisa
        const encargado = await this.prisma.empleado.findUnique({
            where: { usuario_id: usuarioId },
            include: { usuario: true },
        });
        if (!encargado) {
            throw new NotFoundException('El empleado no existe');
        }

        // 2. Buscar la solicitud (con su empleado, para saber quién debe aprobarla)
        const solicitud = await this.prisma.solicitudLicencia.findUnique({
            where: { id: solicitudId },
            include: {
                empleado: { include: { usuario: true } },
                dias: { orderBy: { fecha: 'asc' } },
            },
        });

        if(!solicitud){
            throw new NotFoundException('La solicitud no existe')
        }
        if (solicitud.estado !== 'PENDIENTE'){
            throw new ConflictException('El estado de la solicitud debe estar en pendiente para ser aprobada')
        }
        if (!this.puedeRevisar(encargado, solicitud.empleado)) {
            throw new ForbiddenException('No tenés permisos para revisar esta solicitud');
        }

        // determinar el año del saldo (usamos el año de la fecha de creación)
        const anio = solicitud.fecha_creacion.getFullYear();

        // descontar del saldo del empleado
        await this.saldos.descontarSaldo(
        solicitud.empleado_id,
        solicitud.tipo_licencia_id,
        anio,
        solicitud.dias_descontados,
        );

       const aprobada = await this.prisma.solicitudLicencia.update({
            where: { id: solicitudId },
            data: { estado: 'APROBADA', revisado_por: encargado.id },
            
        });

        // Da formato a los dias pedidos (rango o listado segun corresponda)
        const diasTexto = this.formatearDias(solicitud.dias);

        // No se espera el envío del correo: no debe demorar la respuesta al encargado.
        void this.notificaciones.notificarAprobacion(
            solicitud.empleado.usuario.email,
            `${solicitud.empleado.nombre} ${solicitud.empleado.apellido}`,
            diasTexto,
        );

        // Respaldo del aviso a todos, por si la aprobación llega demasiado
        // tarde para que el cron de víspera llegue a tiempo (ver
        // avisarTodosSiCorresponde). Tampoco se espera esta llamada.
        void this.notificaciones.avisarTodosSiCorresponde(
            solicitud.dias[0].fecha,
            `${solicitud.empleado.nombre} ${solicitud.empleado.apellido}`,
            diasTexto,
        );

        await this.auditoria.registrar({
            usuario_id: encargado.usuario.id,
            usuario_email: encargado.usuario.email,
            accion: 'SOLICITUD_APROBADA',
            descripcion: `Aprobó la solicitud #${solicitud.id} de ${solicitud.empleado.nombre} ${solicitud.empleado.apellido} (${solicitud.dias_descontados} días)`,
            entidad: 'SOLICITUD',
            entidad_id: solicitud.id,
        });

        return aprobada;
    }

    async rechazar(usuarioId: number, solicitudId: number, motivo: string) {
        
        const encargado = await this.prisma.empleado.findUnique({
            where: { usuario_id: usuarioId },
            include: { usuario: true },
        });

        if (!encargado) {
            throw new NotFoundException('El empleado no existe');
        }

        // 2. Buscar la solicitud (con su empleado, para saber quién debe rechazarla)
        const solicitud = await this.prisma.solicitudLicencia.findUnique({
            where: { id: solicitudId },
            include: { empleado: { include: { usuario: true } } },
        });

        if(!solicitud){
            throw new NotFoundException('La solicitud no existe')
        }
        if (solicitud.estado !== 'PENDIENTE'){
            throw new ConflictException('El estado de la solictu debe estar en pendiente para ser aprobada')
        }
        if (!this.puedeRevisar(encargado, solicitud.empleado)) {
            throw new ForbiddenException('No tenés permisos para revisar esta solicitud');
        }

        const rechazada = await this.prisma.solicitudLicencia.update({
            where: { id: solicitudId },
            data: { estado: 'RECHAZADA', revisado_por: encargado.id },
        });

        // No se espera el envío del correo: no debe demorar la respuesta al encargado.
        void this.notificaciones.notificarRechazo(
            solicitud.empleado.usuario.email,
            `${solicitud.empleado.nombre} ${solicitud.empleado.apellido}`,
            motivo,
        );

        await this.auditoria.registrar({
            usuario_id: encargado.usuario.id,
            usuario_email: encargado.usuario.email,
            accion: 'SOLICITUD_RECHAZADA',
            descripcion: `Rechazó la solicitud #${solicitud.id} de ${solicitud.empleado.nombre} ${solicitud.empleado.apellido}. Motivo: ${motivo}`,
            entidad: 'SOLICITUD',
            entidad_id: solicitud.id,
        });

        return rechazada;
    }

    async cancelar(usuarioId: number, solicitudId: number){

        const empleado = await this.prisma.empleado.findUnique({
            where: { usuario_id: usuarioId },
            include: { usuario: true },
        });

        if (!empleado) {
            throw new NotFoundException('El empleado no existe');
        }

        const solicitud = await this.prisma.solicitudLicencia.findUnique({
            where: { id: solicitudId },
            include: { empleado: true, dias: true },
        });

         if(!solicitud){
            throw new NotFoundException('La solicitud no existe')
        }

        if (solicitud.empleado_id !== empleado.id){
            throw new ForbiddenException('No podés cancelar una solicitud que no es tuya')
        }

       if (solicitud.estado !== 'PENDIENTE'){
            throw new ConflictException('El estado de la solicitud debe estar en pendiente para ser cancelada')
        }

        const cancelada = await this.prisma.solicitudLicencia.update({
            where: { id: solicitudId },
            data: {
                estado: 'CANCELADA',
            },
        });

        // Avisar a quien se hubiera enterado de la solicitud original, para que
        // no quede pensando que sigue pendiente de revisar.
        const revisor = await this.buscarRevisor(empleado);
        if (revisor) {
            void this.notificaciones.notificarCancelacion(
                revisor.usuario.email,
                `${empleado.nombre} ${empleado.apellido}`,
                this.formatearDias(solicitud.dias),
            );
        }

        await this.auditoria.registrar({
            usuario_id: empleado.usuario.id,
            usuario_email: empleado.usuario.email,
            accion: 'SOLICITUD_CANCELADA',
            descripcion: `Canceló su solicitud #${solicitud.id}`,
            entidad: 'SOLICITUD',
            entidad_id: solicitud.id,
        });

        return cancelada; 
    }

    async verSemana(desde: string, hasta: string) {
        // Construimos el rango. Sumamos la hora para cubrir todo el día "hasta".
        const fechaDesde = new Date(desde + 'T00:00:00.000Z');
        const fechaHasta = new Date(hasta + 'T23:59:59.999Z');

        const solicitudes = await this.prisma.solicitudLicencia.findMany({
            where: {
            estado: 'APROBADA',
            dias: {
                some: {
                fecha: { gte: fechaDesde, lte: fechaHasta },
                },
            },
            },
            include: {
            tipo_licencia: true,
            empleado: { include: { sector: true } },
            dias: true,
            },
        });

        // Por cada solicitud dejamos SOLO los días que caen dentro de la semana pedida,
        // y devolvemos una forma liviana para el front.
        return solicitudes.map((solicitud) => ({
            solicitud_id: solicitud.id,
            empleado_id: solicitud.empleado_id,
            nombre: solicitud.empleado.nombre,
            apellido: solicitud.empleado.apellido,
            sector: solicitud.empleado.sector?.nombre ?? null,
            tipo_licencia: solicitud.tipo_licencia.nombre,
            dias: solicitud.dias
            .filter((d) => d.fecha >= fechaDesde && d.fecha <= fechaHasta)
            .map((d) => d.fecha.toISOString().split('T')[0])
            .sort(),
        }));
    }

}