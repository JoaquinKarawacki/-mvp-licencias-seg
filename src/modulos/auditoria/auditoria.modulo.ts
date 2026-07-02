import { Module } from '@nestjs/common';
import { AuditoriaServicio } from './auditoria.servicio';
import { AuditoriaControlador } from './auditoria.controlador';
import { PrismaModulo } from '../../prisma/prisma.modulo';

@Module({
  imports: [PrismaModulo],
  controllers: [AuditoriaControlador],
  providers: [AuditoriaServicio],
  exports: [AuditoriaServicio], 
})
export class AuditoriaModulo {}