import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AutenticacionServicio } from './autenticacion.servicio';
import { AutenticacionControlador } from './autenticacion.controlador';
import { JwtEstrategia } from './estrategias/jwt.estrategia';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configServicio: ConfigService) => ({
        secret: configServicio.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configServicio.get<string>('JWT_EXPIRATION') as any,
        },
      }),
    }),
  ],
  controllers: [AutenticacionControlador],
  providers: [AutenticacionServicio, JwtEstrategia],
  exports: [JwtModule],
})
export class AutenticacionModulo {}