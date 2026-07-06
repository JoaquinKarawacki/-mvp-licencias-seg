import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
  async obtenerTodos(
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string,
  ) {
    return this.auditoriaServicio.obtenerTodos(
      pagina ? +pagina : undefined,
      limite ? +limite : undefined,
    );
  }
}
