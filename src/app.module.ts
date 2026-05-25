import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModulo } from './prisma/prisma.modulo';
import { AutenticacionModulo } from './modulos/autenticacion/autenticacion.modulo';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModulo,
    AutenticacionModulo,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}