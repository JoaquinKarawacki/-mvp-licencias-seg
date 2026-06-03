import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModulo } from './prisma/prisma.modulo';
import { AutenticacionModulo } from './modulos/autenticacion/autenticacion.modulo';
import { SectoresModulo } from './modulos/sectores/sectores.modulo';
import { EmpleadosModulo } from './modulos/empleados/empleado.modulo';  
import { TipoLicenciaModulo } from './modulos/licencias/tipos/tipos-licencia.modulo';
import { FeriadoModulo } from './modulos/feriados/feriado.modulo';
import { SolicitudModulo } from './modulos/licencias/solicitud/solicitud.modulo';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModulo,
    AutenticacionModulo,
    SectoresModulo,
    EmpleadosModulo,
    TipoLicenciaModulo,
    FeriadoModulo,
    SolicitudModulo,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}