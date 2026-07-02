import { Module } from '@nestjs/common';
import { FeriadoServicio } from './feriado.servicio';
import { FeriadoControlador } from './feriado.controlador';
import { AuditoriaModulo } from '../auditoria/auditoria.modulo';

@Module({
    imports: [AuditoriaModulo],
    controllers: [FeriadoControlador],
    providers: [FeriadoServicio],
})
export class FeriadoModulo {}
