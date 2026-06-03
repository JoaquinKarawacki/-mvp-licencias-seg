import {Module} from '@nestjs/common';
import { SolicitudesServicio } from './solicitud.servicio';
import { SolicitudesControlador } from './solicitud.controlador';
import { CalculadorServicio } from '../calculador/calculador.servicio';


@Module({
  controllers: [SolicitudesControlador],
  providers: [SolicitudesServicio, CalculadorServicio],
})
export class SolicitudModulo {} 
