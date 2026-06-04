import { Module } from '@nestjs/common';
import { NotificacionesServicio } from './notificaciones.servicio';

@Module({
  providers: [NotificacionesServicio],
  exports: [NotificacionesServicio],
})
export class NotificacionesModulo {}