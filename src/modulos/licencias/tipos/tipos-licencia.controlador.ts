import { Controller, Get, Post, Patch, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { CrearTipoLicenciaDto } from './dto/crear-tipo-licencia.dto';
import { ActualizarTipoLicenciaDto } from './dto/actualizar-tipo-licencia.dto';
import { TipoLicenciaServicio } from './tipos-licencia.servicio';
import { JwtGuardia } from '../../../comun/guardias/jwt.guardia';
import { RolesGuardia } from '../../../comun/guardias/roles.guardias';
import { Roles } from '../../../comun/decoradores/roles.decorador';
import { UsuarioActual } from '../../../comun/decoradores/usuario-actual.decorador';

@Controller('tipos-licencia')
@UseGuards(JwtGuardia, RolesGuardia)
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
  @Roles('ADMIN')
  @UseGuards(RolesGuardia)
  async crear(
    @UsuarioActual() usuario: { id: number; email: string },
    @Body() crearTipoLicenciaDto: CrearTipoLicenciaDto,
  ) {
    return this.tipoLicenciaServicio.crear(crearTipoLicenciaDto, usuario.id, usuario.email);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuardia)
  async actualizar(
    @Param('id') id: string,
    @UsuarioActual() usuario: { id: number; email: string },
    @Body() actualizarTipoLicenciaDto: ActualizarTipoLicenciaDto,
  ) {
    return this.tipoLicenciaServicio.actualizar(+id, actualizarTipoLicenciaDto, usuario.id, usuario.email);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuardia)
  async eliminar(
    @Param('id') id: string,
    @UsuarioActual() usuario: { id: number; email: string },
  ) {
    return this.tipoLicenciaServicio.eliminar(+id, usuario.id, usuario.email);
  }
}
