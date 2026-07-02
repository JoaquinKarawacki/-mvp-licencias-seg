import { Module } from '@nestjs/common';
import { SectoresServicio } from './sectores.servicios';
import { SectoresControlador } from './sector.controlador';
import { AuditoriaModulo } from '../auditoria/auditoria.modulo';

@Module({
  imports: [AuditoriaModulo],
  controllers: [SectoresControlador],
  providers: [SectoresServicio],
})
export class SectoresModulo {}
