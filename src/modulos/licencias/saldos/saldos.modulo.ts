import {Module} from '@nestjs/common';
import { SaldosServicio } from './saldos.servicio';
import { SaldosControlador } from './saldos.controlador';

@Module({
  controllers: [SaldosControlador],
  providers: [SaldosServicio],
})
export class SaldoModulo {} 
