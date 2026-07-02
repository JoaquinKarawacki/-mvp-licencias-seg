import { Module } from '@nestjs/common';
import { SolicitudesServicio } from './solicitud.servicio';
import { SolicitudesControlador } from './solicitud.controlador';
import { CalculadorServicio } from '../calculador/calculador.servicio';
import { SaldosServicio } from '../saldos/saldos.servicio';
import { NotificacionesModulo } from '../../notificaciones/notificaciones.modulo';
import { AuditoriaModulo } from '../../auditoria/auditoria.modulo';

@Module({
  imports: [NotificacionesModulo, AuditoriaModulo],
  controllers: [SolicitudesControlador],
  providers: [SolicitudesServicio, CalculadorServicio, SaldosServicio],
})
export class SolicitudModulo {}