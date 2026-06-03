import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { SolicitudesServicio } from './solicitud.servicio';
import { CrearSolicitudLicenciaDto } from './dto/crear-solicitud.dto';
import { RechazarSolicitudDto } from './dto/rechazar-solicitud.dto';
import { JwtGuardia } from '../../../comun/guardias/jwt.guardia';
import { UsuarioActual } from '../../../comun/decoradores/usuario-actual.decorador';

@Controller('solicitudes')
@UseGuards(JwtGuardia)
export class SolicitudesControlador {
  constructor(private readonly solicitudesServicio: SolicitudesServicio) {}

  @Post()
  async crear(
    @UsuarioActual() usuario: { id: number },
    @Body() dto: CrearSolicitudLicenciaDto,
  ) {
    return this.solicitudesServicio.crear(usuario.id, dto);
  }

  @Get('mias')
  async verMias(@UsuarioActual() usuario: { id: number }) {
    return this.solicitudesServicio.verMias(usuario.id);
  }

  @Get('pendientes')
  async verPendientes(@UsuarioActual() usuario: { id: number }) {
    return this.solicitudesServicio.verPendientes(usuario.id);
  }

  @Patch(':id/aprobar')
  async aprobar(
    @Param('id') id: string,
    @UsuarioActual() usuario: { id: number },
  ) {
    return this.solicitudesServicio.aprobar(usuario.id, +id);
  }

  @Patch(':id/rechazar')
  async rechazar(
    @Param('id') id: string,
    @UsuarioActual() usuario: { id: number },
    @Body() dto: RechazarSolicitudDto,
  ) {
    return this.solicitudesServicio.rechazar(usuario.id, +id, dto.motivo_rechazo);
  }

  @Patch(':id/cancelar')
  async cancelar(
    @Param('id') id: string,
    @UsuarioActual() usuario: { id: number },
  ) {
    return this.solicitudesServicio.cancelar(usuario.id, +id);
  }
}