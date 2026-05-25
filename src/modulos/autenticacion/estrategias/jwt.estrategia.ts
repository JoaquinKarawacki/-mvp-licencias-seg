import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaServicio } from '../../../prisma/prisma.servicio';

@Injectable()
export class JwtEstrategia extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaServicio) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? '',
    });
  }

  async validate(payload: { sub: number; email: string; rol: string }) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
    });

    if (!usuario || !usuario.esta_activo) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };
  }
}