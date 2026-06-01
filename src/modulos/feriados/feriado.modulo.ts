import { Module } from '@nestjs/common';
import { FeriadoServicio } from './feriado.servicio';
import { FeriadoControlador } from './feriado.controlador';

@Module({
    controllers:[FeriadoControlador],
    providers: [FeriadoServicio]
})
export class FeriadoModulo {}