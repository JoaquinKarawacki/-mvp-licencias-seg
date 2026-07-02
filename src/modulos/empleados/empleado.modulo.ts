import { EmpleadosControlador } from './empleados.controlador';
import { EmpleadosServicio } from './empleados.servicio';
import { Module } from '@nestjs/common';
import { AuditoriaModulo } from '../auditoria/auditoria.modulo';

@Module({
  imports: [AuditoriaModulo],
  controllers: [EmpleadosControlador],
  providers: [EmpleadosServicio],
})
export class EmpleadosModulo {}
