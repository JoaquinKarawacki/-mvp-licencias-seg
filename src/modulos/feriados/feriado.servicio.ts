import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaServicio } from '../../prisma/prisma.servicio';
import { CrearFeriadoDto } from './dto/crear-feriado.dto';
import { ActualizarFeriadoDto } from './dto/actualizar-feriado.dto';
import { AuditoriaServicio } from '../auditoria/auditoria.servicio';

@Injectable()
export class FeriadoServicio {
    constructor(
        private readonly prisma: PrismaServicio,
        private readonly auditoria: AuditoriaServicio,
    ) {}

    async obtenerTodos() {
        return this.prisma.feriado.findMany({
            orderBy: { fecha: 'asc' },
        });
    }

    async crear(crearFeriadoDto: CrearFeriadoDto, usuarioId: number, usuarioEmail: string) {
        const fecha = new Date(crearFeriadoDto.fecha);

        const feriadoExistente = await this.prisma.feriado.findFirst({
            where: { fecha },
        });

        if (feriadoExistente) {
            throw new ConflictException('El feriado ya existe');
        }

        const creado = await this.prisma.feriado.create({
            data: {
                nombre: crearFeriadoDto.nombre,
                fecha,
                es_recurrente: crearFeriadoDto.es_recurrente ?? false,
            },
        });

        await this.auditoria.registrar({
            usuario_id: usuarioId,
            usuario_email: usuarioEmail,
            accion: 'FERIADO_CREADO',
            descripcion: `Creó el feriado ${creado.nombre}`,
            entidad: 'FERIADO',
            entidad_id: creado.id,
        });

        return creado;
    }

    async actualizar(id: number, actualizarFeriadoDto: ActualizarFeriadoDto, usuarioId: number, usuarioEmail: string) {
        const feriadoExistente = await this.prisma.feriado.findUnique({
            where: { id },
        });

        if (!feriadoExistente) {
            throw new NotFoundException('El feriado no existe');
        }

        if (actualizarFeriadoDto.fecha) {
            const fecha = new Date(actualizarFeriadoDto.fecha);
            const fechaDuplicada = await this.prisma.feriado.findFirst({
                where: {
                    fecha,
                    NOT: { id },
                },
            });
            if (fechaDuplicada) {
                throw new ConflictException('ya existe un feriado con esa fecha');
            }
        }

        const { fecha, ...resto } = actualizarFeriadoDto;
        const actualizado = await this.prisma.feriado.update({
            where: { id },
            data: {
                ...resto,
                ...(fecha && { fecha: new Date(fecha) }),
            },
        });

        await this.auditoria.registrar({
            usuario_id: usuarioId,
            usuario_email: usuarioEmail,
            accion: 'FERIADO_ACTUALIZADO',
            descripcion: `Editó el feriado ${actualizado.nombre}`,
            entidad: 'FERIADO',
            entidad_id: actualizado.id,
        });

        return actualizado;
    }

    async obtenerUno(id: number) {
        const feriado = await this.prisma.feriado.findUnique({
            where: { id },
        });
        if (!feriado) {
            throw new NotFoundException('El feriado no existe');
        }
        return feriado;
    }

    async eliminar(id: number, usuarioId: number, usuarioEmail: string) {
        const feriadoExistente = await this.prisma.feriado.findUnique({
            where: { id },
        });
        if (!feriadoExistente) {
            throw new NotFoundException('El feriado no existe');
        }

        const eliminado = await this.prisma.feriado.delete({
            where: { id },
        });

        await this.auditoria.registrar({
            usuario_id: usuarioId,
            usuario_email: usuarioEmail,
            accion: 'FERIADO_ELIMINADO',
            descripcion: `Eliminó el feriado ${feriadoExistente.nombre}`,
            entidad: 'FERIADO',
            entidad_id: id,
        });

        return eliminado;
    }
}
