import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModulo } from './prisma/prisma.modulo';
import { AutenticacionModulo } from './modulos/autenticacion/autenticacion.modulo';
import { SectoresModulo } from './modulos/sectores/sectores.modulo';
import { EmpleadosModulo } from './modulos/empleados/empleado.modulo';  
import { TipoLicenciaModulo } from './modulos/licencias/tipos/tipos-licencia.modulo';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}