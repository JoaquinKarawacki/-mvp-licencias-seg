import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaServicio } from '../../../prisma/prisma.servicio';
import { CrearTipoLicenciaDto } from './dto/crear-tipo-licencia.dto';
import { ActualizarTipoLicenciaDto } from './dto/actualizar-tipo-licencia.dto';
import { AuditoriaServicio } from '../../auditoria/auditoria.servicio';

@Injectable()
export class TipoLicenciaServicio {
  constructor(
    private readonly prisma: PrismaServicio,
    private readonly auditoria: AuditoriaServicio,
  ) {}

    async obtenerTodos() {
        return this.prisma.tipoLicencia.findMany();
    }

    async crear(crearTipoLicenciaDto: CrearTipoLicenciaDto, usuarioId: number, usuarioEmail: string) {
        const { codigo } = crearTipoLicenciaDto;

        const licenciaExistente = await this.prisma.tipoLicencia.findUnique({
            where: { codigo },
        });
        if (licenciaExistente) {
            throw new ConflictException('El tipo de licencia ya existe');
        }

        const creado = await this.prisma.tipoLicencia.create({
            data: crearTipoLicenciaDto,
        });

        await this.auditoria.registrar({
            usuario_id: usuarioId,
            usuario_email: usuarioEmail,
            accion: 'TIPO_LICENCIA_CREADO',
            descripcion: `Creó el tipo de licencia ${creado.nombre} (${creado.codigo})`,
            entidad: 'TIPO_LICENCIA',
            entidad_id: creado.id,
        });

        return creado;
    }

    async actualizar(id: number, actualizarTipoLicenciaDto: ActualizarTipoLicenciaDto, usuarioId: number, usuarioEmail: string) {
        const licenciaTipo = await this.prisma.tipoLicencia.findUnique({
            where: { id },
        });

        if (!licenciaTipo) {
            throw new NotFoundException('El tipo de licencia no existe');
        }

        if (actualizarTipoLicenciaDto.codigo) {
            const codigoDuplicado = await this.prisma.tipoLicencia.findFirst({
                where: {
                    codigo: actualizarTipoLicenciaDto.codigo,
                    NOT: { id },
                },
            });

            if (codigoDuplicado) {
                throw new ConflictException('Ya existe una licencia con ese nombre');
            }
        }

        const actualizado = await this.prisma.tipoLicencia.update({
            where: { id },
            data: actualizarTipoLicenciaDto,
        });

        await this.auditoria.registrar({
            usuario_id: usuarioId,
            usuario_email: usuarioEmail,
            accion: 'TIPO_LICENCIA_ACTUALIZADO',
            descripcion: `Editó el tipo de licencia ${actualizado.nombre} (${actualizado.codigo})`,
            entidad: 'TIPO_LICENCIA',
            entidad_id: actualizado.id,
        });

        return actualizado;
    }

    async obtenerUno(id: number) {
        const tipoLicencia = await this.prisma.tipoLicencia.findUnique({
            where: { id },
        });

        if (!tipoLicencia) {
            throw new NotFoundException('Tipo de licencia no encontrado');
        }

        return tipoLicencia;
    }

    async eliminar(id: number, usuarioId: number, usuarioEmail: string) {
        const tipoLicencia = await this.prisma.tipoLicencia.findUnique({
            where: { id },
        });
        if (!tipoLicencia) {
            throw new NotFoundException('El tipo de licencia no existe');
        }

        try {
            const eliminado = await this.prisma.tipoLicencia.delete({
                where: { id },
            });

            await this.auditoria.registrar({
                usuario_id: usuarioId,
                usuario_email: usuarioEmail,
                accion: 'TIPO_LICENCIA_ELIMINADO',
                descripcion: `Eliminó el tipo de licencia ${tipoLicencia.nombre} (${tipoLicencia.codigo})`,
                entidad: 'TIPO_LICENCIA',
                entidad_id: id,
            });

            return eliminado;
        } catch (error: any) {
            if (error.code === 'P2003') {
                throw new ConflictException('No se puede eliminar: tiene saldos o solicitudes asociadas');
            }
            throw error;
        }
    }
}
