import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaServicio } from '../../prisma/prisma.servicio';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AutenticacionServicio {
  constructor(
    private readonly prisma: PrismaServicio,
    private readonly jwtServicio: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, contrasena } = loginDto;

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.esta_activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.hash_contrasena);

    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };

    const token = await this.jwtServicio.signAsync(payload);

    return {
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }
}