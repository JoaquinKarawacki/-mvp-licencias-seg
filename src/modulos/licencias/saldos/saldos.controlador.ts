import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards } from '@nestjs/common';
import { SaldosServicio } from './saldos.servicio';
import { GenerarSaldoDto } from './dto/generar-saldo.dto';
import { AjustarSaldoDto } from './dto/ajustar-saldo.dto';
import { JwtGuardia } from '../../../comun/guardias/jwt.guardia';
import { RolesGuardia } from '../../../comun/guardias/roles.guardias';
import { Roles } from '../../../comun/decoradores/roles.decorador';
import { UsuarioActual } from '../../../comun/decoradores/usuario-actual.decorador';

@Controller('saldos')
@UseGuards(JwtGuardia)
export class SaldosControlador {
  constructor(private readonly saldosServicio: SaldosServicio) {}

  @Get('mios')
  async verMiSaldo(
    @UsuarioActual() usuario: { id: number },
    @Query('anio') anio: string,
  ) {
    return this.saldosServicio.verMiSaldo(usuario.id, +anio);
  }

  @Get('equipo')
  async verSaldosEquipo(
    @UsuarioActual() usuario: { id: number },
    @Query('anio') anio: string,
  ) {
    return this.saldosServicio.verSaldosEquipo(usuario.id, +anio);
  }

  @Get('empleado/:id')
  @Roles('ADMIN')
  @UseGuards(RolesGuardia)
  async verSaldoEmpleado(
    @Param('id') id: string,
    @Query('anio') anio: string,
  ) {
    return this.saldosServicio.verSaldoEmpleado(+id, +anio);
  }

  @Get('todos')
  @Roles('ADMIN')
  @UseGuards(RolesGuardia)
  async verTodosLosSaldos(@Query('anio') anio: string) {
    return this.saldosServicio.verTodosLosSaldos(+anio);
  }

  @Post('generar')
  @Roles('ADMIN')
  @UseGuards(RolesGuardia)
  async generar(
    @UsuarioActual() usuario: { id: number; email: string },
    @Body() dto: GenerarSaldoDto,
  ) {
    return this.saldosServicio.generarSaldo(
      dto.empleado_id,
      dto.tipo_licencia_id,
      dto.anio,
      usuario.id,
      usuario.email,
    );
  }

  @Patch('ajustar')
  @Roles('ADMIN')
  @UseGuards(RolesGuardia)
  async ajustar(
    @UsuarioActual() usuario: { id: number; email: string },
    @Body() dto: AjustarSaldoDto,
  ) {
    return this.saldosServicio.ajustarSaldo(
      dto.empleado_id,
      dto.tipo_licencia_id,
      dto.anio,
      dto.dias,
      usuario.id,
      usuario.email,
    );
  }
}