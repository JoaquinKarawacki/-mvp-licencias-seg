import { EmpleadosControlador } from './empleados.controlador';
import {EmpleadosServicio} from './empleados.servicio';
import {Module} from '@nestjs/common';

@Module({
  controllers: [EmpleadosControlador],
  providers: [EmpleadosServicio],
})
export class EmpleadosModulo {} 
