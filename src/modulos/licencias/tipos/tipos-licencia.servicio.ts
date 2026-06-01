import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaServicio } from '../../../prisma/prisma.servicio';
import { CrearTipoLicenciaDto } from './dto/crear-tipo-licencia.dto';
import { ActualizarTipoLicenciaDto } from './dto/actualizar-tipo-licencia.dto';

@Injectable()
export class TipoLicenciaServicio {
  constructor(private readonly prisma: PrismaServicio) {}

    async obtenerTodos() {
        return this.prisma.tipoLicencia.findMany();
    }

    async crear(crearTipoLicenciaDto: CrearTipoLicenciaDto){
        const {codigo} = crearTipoLicenciaDto;

        const licenciaExistente = await this.prisma.tipoLicencia.findUnique({
            where : {codigo},
        });
        if(licenciaExistente){
            throw new ConflictException("El tipo de licencia ya existe");
        }
        return this.prisma.tipoLicencia.create({
            data: crearTipoLicenciaDto,
        });
    }

    async actualizar(id: number, actualizarTipoLicenciaDto: ActualizarTipoLicenciaDto) {
        const licenciaTipo = await this.prisma.tipoLicencia.findUnique({
            where : {id},
        });

        if(!licenciaTipo){
            throw new NotFoundException("El tipo de licencia no existe");
        }

        if(actualizarTipoLicenciaDto.codigo){
            const codigoDuplicado = await this.prisma.tipoLicencia.findFirst({
                where: {
                    codigo : actualizarTipoLicenciaDto.codigo,
                    NOT:  {id},
                }
            });

            if(codigoDuplicado){
                throw new ConflictException("Ya existe una licencia con ese nombre");
            }
            
        }

        return this.prisma.tipoLicencia.update({
            where: {id},
            data: actualizarTipoLicenciaDto,
        });
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


}












