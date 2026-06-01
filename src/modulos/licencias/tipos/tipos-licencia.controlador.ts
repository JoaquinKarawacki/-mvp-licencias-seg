import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { CrearTipoLicenciaDto } from './dto/crear-tipo-licencia.dto';
import { ActualizarTipoLicenciaDto } from './dto/actualizar-tipo-licencia.dto';
import { TipoLicenciaServicio } from './tipos-licencia.servicio';
import { JwtGuardia } from '../../../comun/guardias/jwt.guardia';
import { RolesGuardia } from '../../../comun/guardias/roles.guardias';
import { Roles } from '../../../comun/decoradores/roles.decorador';

@Controller('tipos-licencia')
@UseGuards(JwtGuardia, RolesGuardia)
@Roles('ADMIN')
export class TipoLicenciaControlador {
  constructor(private readonly tipoLicenciaServicio: TipoLicenciaServicio) {}

  @Get()
  async obtenerTodos() {
    return this.tipoLicenciaServicio.obtenerTodos();
  }

  @Get(':id')
  async obtenerUno(@Param('id') id: string) {
    return this.tipoLicenciaServicio.obtenerUno(+id);
  }

  @Post()
  async crear(@Body() crearTipoLicenciaDto: CrearTipoLicenciaDto) {
    return this.tipoLicenciaServicio.crear(crearTipoLicenciaDto);
  }

  @Patch(':id')
  async actualizar(@Param('id') id: string, @Body() actualizarTipoLicenciaDto: ActualizarTipoLicenciaDto) {
    return this.tipoLicenciaServicio.actualizar(+id, actualizarTipoLicenciaDto);
  }
}