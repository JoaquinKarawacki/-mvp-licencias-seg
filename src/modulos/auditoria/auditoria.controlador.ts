import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditoriaServicio } from './auditoria.servicio';
import { JwtGuardia } from '../../comun/guardias/jwt.guardia';
import { RolesGuardia } from '../../comun/guardias/roles.guardias';
import { Roles } from '../../comun/decoradores/roles.decorador';

@Controller('auditoria')
@UseGuards(JwtGuardia, RolesGuardia)
@Roles('ADMIN')
export class AuditoriaControlador {
  constructor(private readonly auditoriaServicio: AuditoriaServicio) {}

  @Get()
  async obtenerTodos() {
    return this.auditoriaServicio.obtenerTodos();
  }
}