import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { SectoresServicio } from './sectores.servicios';
import { CrearSectorDto } from './dto/crear-sector.dto';
import { ActualizarSectorDto } from './dto/actualizar-sector.dto';
import { JwtGuardia } from '../../comun/guardias/jwt.guardia';
import { RolesGuardia } from '../../comun/guardias/roles.guardias';
import { Roles } from '../../comun/decoradores/roles.decorador';

@Controller('sectores')
@UseGuards(JwtGuardia, RolesGuardia)
@Roles('ADMIN')
export class SectoresControlador {
  constructor(private readonly sectoresServicio: SectoresServicio) {}

  @Get()
  async obtenerTodos() {
    return this.sectoresServicio.obtenerTodos();
  }

  @Post()
  async crear(@Body() crearSectorDto: CrearSectorDto) {
    return this.sectoresServicio.crear(crearSectorDto);
  }

  @Patch(':id')
  async actualizar(@Param('id') id: string, @Body() actualizarSectorDto: ActualizarSectorDto) {
    return this.sectoresServicio.actualizar(+id, actualizarSectorDto);
  }
}
