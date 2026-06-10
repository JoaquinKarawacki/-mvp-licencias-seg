import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModulo } from './prisma/prisma.modulo';
import { AutenticacionModulo } from './modulos/autenticacion/autenticacion.modulo';
import { SectoresModulo } from './modulos/sectores/sectores.modulo';
import { EmpleadosModulo } from './modulos/empleados/empleado.modulo';  
import { TipoLicenciaModulo } from './modulos/licencias/tipos/tipos-licencia.modulo';
import { FeriadoModulo } from './modulos/feriados/feriado.modulo';
import { SolicitudModulo } from './modulos/licencias/solicitud/solicitud.modulo';
import { SaldoModulo } from './modulos/licencias/saldos/saldos.modulo';
import { NotificacionesModulo } from './modulos/notificaciones/notificaciones.modulo';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModulo,
    AutenticacionModulo,
    SectoresModulo,
    EmpleadosModulo,
    TipoLicenciaModulo,
    FeriadoModulo,
    SolicitudModulo,
    SaldoModulo,
    NotificacionesModulo,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}