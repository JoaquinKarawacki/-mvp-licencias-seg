import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaServicio } from '../../prisma/prisma.servicio';
import { CrearSectorDto } from './dto/crear-sector.dto';
import { ActualizarSectorDto } from './dto/actualizar-sector.dto';
import { AuditoriaServicio } from '../auditoria/auditoria.servicio';

@Injectable()
export class SectoresServicio {
  constructor(
    private readonly prisma: PrismaServicio,
    private readonly auditoria: AuditoriaServicio,
  ) {}

    async obtenerTodos() {
        return this.prisma.sector.findMany({
            include: {
                _count: {
                    select: { empleados: true },
                },
            },
        });
    }

    async crear(crearSectorDto: CrearSectorDto, usuarioId: number, usuarioEmail: string) {
        const { nombre } = crearSectorDto;

        const sectorExistente = await this.prisma.sector.findUnique({
            where: { nombre },
        });

        if (sectorExistente) {
            throw new ConflictException('Ya existe un sector con ese nombre');
        }

        const creado = await this.prisma.sector.create({
            data: { nombre },
        });

        await this.auditoria.registrar({
            usuario_id: usuarioId,
            usuario_email: usuarioEmail,
            accion: 'SECTOR_CREADO',
            descripcion: `Creó el sector ${creado.nombre}`,
            entidad: 'SECTOR',
            entidad_id: creado.id,
        });

        return creado;
    }

    async actualizar(id: number, actualizarSectorDto: ActualizarSectorDto, usuarioId: number, usuarioEmail: string) {
        const sectorExistente = await this.prisma.sector.findUnique({
            where: { id },
        });

        if (!sectorExistente) {
            throw new NotFoundException('Sector no encontrado');
        }

        if (actualizarSectorDto.nombre) {
            const nombreDuplicado = await this.prisma.sector.findFirst({
                where: {
                    nombre: actualizarSectorDto.nombre,
                    NOT: { id },
                },
            });

            if (nombreDuplicado) {
                throw new ConflictException('Ya existe un sector con ese nombre');
            }
        }

        const actualizado = await this.prisma.sector.update({
            where: { id },
            data: actualizarSectorDto,
        });

        await this.auditoria.registrar({
            usuario_id: usuarioId,
            usuario_email: usuarioEmail,
            accion: 'SECTOR_ACTUALIZADO',
            descripcion: `Editó el sector ${actualizado.nombre}`,
            entidad: 'SECTOR',
            entidad_id: actualizado.id,
        });

        return actualizado;
    }
}
