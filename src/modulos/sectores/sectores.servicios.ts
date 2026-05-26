import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaServicio } from '../../prisma/prisma.servicio';
import { CrearSectorDto } from './dto/crear-sector.dto';
import { ActualizarSectorDto } from './dto/actualizar-sector.dto';


@Injectable()
export class SectoresServicio {
  constructor(private readonly prisma: PrismaServicio) {}

    async obtenerTodos() {
    return this.prisma.sector.findMany({
        include: {
        _count: {
            select: { empleados: true },
        },
        },
    });
    }

    async crear(crearSectorDto: CrearSectorDto) {
        const { nombre } = crearSectorDto;
        
        const sectorExistente = await this.prisma.sector.findUnique({
            where: { nombre },
        });

        if (sectorExistente) {
            throw new ConflictException('Ya existe un sector con ese nombre');
        }
        return this.prisma.sector.create({
            data: { nombre },
        });
    }

    async actualizar(id: number, actualizarSectorDto: ActualizarSectorDto) {
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

        return this.prisma.sector.update({
            where: { id },
            data: actualizarSectorDto,
        });
    }

}












