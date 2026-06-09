import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { CrearFeriadoDto } from './dto/crear-feriado.dto';
import { ActualizarFeriadoDto } from './dto/actualizar-feriado.dto';
import { FeriadoServicio } from './feriado.servicio';
import { JwtGuardia } from '../../comun/guardias/jwt.guardia';
import { RolesGuardia } from '../../comun/guardias/roles.guardias';
import { Roles } from '../../comun/decoradores/roles.decorador';


@Controller('feriados')
@UseGuards(JwtGuardia, RolesGuardia)
@Roles('ADMIN')
export class FeriadoControlador {
    constructor(private readonly feriadoServicio: FeriadoServicio){}

    @Get()
    async obtenerTodos(){
        return this.feriadoServicio.obtenerTodos();
    }

    @Get(':id')
    async obtenerUno(@Param('id') id: string){
        return this.feriadoServicio.obtenerUno(+id);
    }

    @Post()
    async crear(@Body() crearFeriadoDto: CrearFeriadoDto){
        return this.feriadoServicio.crear(crearFeriadoDto);
    }

    @Patch(':id')
    async actualizar(
    @Param('id') id: string,
    @Body() actualizarFeriadoDto: ActualizarFeriadoDto,
    ) {
        return this.feriadoServicio.actualizar(+id, actualizarFeriadoDto);
    }
}