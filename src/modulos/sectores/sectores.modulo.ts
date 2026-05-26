import { Module } from '@nestjs/common';
import { SectoresServicio } from './sectores.servicios';
import { SectoresControlador } from './sector.controlador';


@Module({
  controllers: [SectoresControlador],
  providers: [SectoresServicio],
})
export class SectoresModulo {}