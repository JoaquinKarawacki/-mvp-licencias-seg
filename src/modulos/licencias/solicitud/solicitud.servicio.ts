import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaServicio } from '../../../prisma/prisma.servicio';
import { CalculadorServicio } from '../calculador/calculador.servicio';
import { CrearSolicitudLicenciaDto } from './dto/crear-solicitud.dto';


@Injectable()
export class SolicitudesServicio {
  constructor(
    private readonly prisma: PrismaServicio,
    private readonly calculador: CalculadorServicio,
  ) {}

    async crear(usuarioId: number, crearSolicitudLicenciaDto: CrearSolicitudLicenciaDto) {
        
        // 1. Buscar el empleado a partir del usuario del token
        const empleado = await this.prisma.empleado.findUnique({
            where: { usuario_id: usuarioId },
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
        if (!empleado.es_encargado) {
            throw new ForbiddenException('Solo los encargados pueden ver solicitudes pendientes');
        }

        return this.prisma.solicitudLicencia.findMany({
            where: {
                estado: 'PENDIENTE',
                empleado: { sector_id: empleado.sector_id },
            },
            include: {
                dias: true,
                tipo_licencia: true,
                empleado: true,
            },
            orderBy: { fecha_creacion: 'asc' },
        });
    }

    async aprobar(usuarioId: number, solicitudId: number) {
        // 1. Buscar el encargado
        const encargado = await this.prisma.empleado.findUnique({
            where: { usuario_id: usuarioId },
        });
        if (!encargado) {
            throw new NotFoundException('El empleado no existe');
        }
        if (!encargado.es_encargado) {
            throw new ForbiddenException('Solo los encargados pueden aprobar solicitudes');
        }

        // 2. Buscar la solicitud (con su empleado, para saber el sector)
        const solicitud = await this.prisma.solicitudLicencia.findUnique({
            where: { id: solicitudId },
            include: { empleado: true },
        });

        if(!solicitud){
            throw new NotFoundException('La solicitud no existe')
        }
        if (solicitud.estado !== 'PENDIENTE'){
            throw new ConflictException('El estado de la solicitud debe estar en pendiente para ser aprobada')
        }
        if(solicitud.empleado.sector_id !== encargado.sector_id){
            throw new ForbiddenException('El empleado debe pertenecer al mismo sector que el encargado')
        }
        
    return this.prisma.solicitudLicencia.update({
            where: { id: solicitudId },
            data: {
                estado: 'APROBADA',
                revisado_por: encargado.id,
            },
        });
    }

    async rechazar(usuarioId: number, solicitudId: number, motivo: string) {
        
        const encargado = await this.prisma.empleado.findUnique({
            where: { usuario_id: usuarioId },
        });

        if (!encargado) {
            throw new NotFoundException('El empleado no existe');
        }

        if (!encargado.es_encargado) {
            throw new ForbiddenException('Solo los encargados pueden aprobar solicitudes');
        }

        // 2. Buscar la solicitud (con su empleado, para saber el sector)
        const solicitud = await this.prisma.solicitudLicencia.findUnique({
            where: { id: solicitudId },
            include: { empleado: true },
        });

        if(!solicitud){
            throw new NotFoundException('La solicitud no existe')
        }
        if (solicitud.estado !== 'PENDIENTE'){
            throw new ConflictException('El estado de la solictu debe estar en pendiente para ser aprobada')
        }
        if(solicitud.empleado.sector_id !== encargado.sector_id){
            throw new ForbiddenException('El empleado debe pertenecer al mismo sector que el encargado')
        }
        
        return this.prisma.solicitudLicencia.update({
            where: { id: solicitudId },
            data: {
                estado: 'RECHAZADA',
                motivo_rechazo: motivo,
                revisado_por: encargado.id,
            },
        });
    }

    async cancelar(usuarioId: number, solicitudId: number){

        const empleado = await this.prisma.empleado.findUnique({
            where: { usuario_id: usuarioId },
        });

        if (!empleado) {
            throw new NotFoundException('El empleado no existe');
        }

        const solicitud = await this.prisma.solicitudLicencia.findUnique({
            where: { id: solicitudId },
            include: { empleado: true },
        });

         if(!solicitud){
            throw new NotFoundException('La solicitud no existe')
        }
        
        if (solicitud.empleado_id !== empleado.id){
            throw new ForbiddenException('No podés cancelar una solicitud que no es tuya')
        }

        if (solicitud.estado !== 'PENDIENTE'){
            throw new ConflictException('El estado de la solictu debe estar en pendiente para ser aprobada')
        }
         return this.prisma.solicitudLicencia.update({
            where: { id: solicitudId },
            data: {
                estado: 'CANCELADA',
            },
        });
    
    }


}