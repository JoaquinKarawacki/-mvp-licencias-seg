import { Controller, Get, Post, Patch, Body, Query, UseGuards } from '@nestjs/common';
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

  @Post('generar')
  @Roles('ADMIN')
  @UseGuards(RolesGuardia)
  async generar(@Body() dto: GenerarSaldoDto) {
    return this.saldosServicio.generarSaldo(
      dto.empleado_id,
      dto.tipo_licencia_id,
      dto.anio,
    );
  }

  @Patch('ajustar')
  @Roles('ADMIN')
  @UseGuards(RolesGuardia)
  async ajustar(@Body() dto: AjustarSaldoDto) {
    return this.saldosServicio.ajustarSaldo(
      dto.empleado_id,
      dto.tipo_licencia_id,
      dto.anio,
      dto.dias,
    );
  }
}