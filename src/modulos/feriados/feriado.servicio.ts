import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaServicio } from '../../prisma/prisma.servicio';
import { CrearFeriadoDto } from './dto/crear-feriado.dto';
import { ActualizarFeriadoDto } from './dto/actualizar-feriado.dto';


@Injectable()
export class FeriadoServicio{
    constructor(private readonly prisma: PrismaServicio){}

    async obtenerTodos(){
        return this.prisma.feriado.findMany({
            orderBy: {fecha: 'asc'} 
        });
    }
    
    async crear(crearFeriadoDto: CrearFeriadoDto){
        const fecha = new Date(crearFeriadoDto.fecha);

        const feriadoExistente = await this.prisma.feriado.findFirst({
            where: {fecha}
        });
        
        if(feriadoExistente){
            throw new ConflictException('El feriado ya existe');
        }
        
        return this.prisma.feriado.create({
            data: {
                nombre: crearFeriadoDto.nombre,
                fecha,                                    
                es_recurrente: crearFeriadoDto.es_recurrente ?? false,
            },
        });
    }

    async actualizar(id: number, actualizarFeriadoDto: ActualizarFeriadoDto){
        const feriadoExistente = await this.prisma.feriado.findUnique({
            where: {id},
        });

        if(!feriadoExistente){
            throw new NotFoundException('El feriado no existe');
        }
        if(actualizarFeriadoDto.fecha){
            const fecha = new Date(actualizarFeriadoDto.fecha);
            const fechaDuplicada = await this.prisma.feriado.findFirst({
                where : {
                    fecha : fecha,
                    NOT: {id}, 
                }
            });
            if(fechaDuplicada){
                    throw new ConflictException('ya existe un feriado con esa fecha')
            }
        }
        const { fecha, ...resto } = actualizarFeriadoDto;
        return this.prisma.feriado.update({
            where: {id},
             data: {
                ...resto,
                ...(fecha && { fecha: new Date(fecha) }),
            },
        });
    }

    async obtenerUno(id: number){
        const feriado = await this.prisma.feriado.findUnique({
            where: {id}, 
        });
        if(!feriado){
            throw new NotFoundException('El feriado no existe');
        }
        return feriado;
    }
}