import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModulo } from './prisma/prisma.modulo';
import { AutenticacionModulo } from './modulos/autenticacion/autenticacion.modulo';
import { SectoresModulo } from './modulos/sectores/sectores.modulo';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModulo,
    AutenticacionModulo,
    SectoresModulo, 
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}