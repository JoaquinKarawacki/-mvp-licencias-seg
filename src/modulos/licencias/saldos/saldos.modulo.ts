import { Module } from '@nestjs/common';
import { SaldosServicio } from './saldos.servicio';
import { SaldosControlador } from './saldos.controlador';
import { AuditoriaModulo } from '../../auditoria/auditoria.modulo';

@Module({
  imports: [AuditoriaModulo],
  controllers: [SaldosControlador],
  providers: [SaldosServicio],
})
export class SaldoModulo {}