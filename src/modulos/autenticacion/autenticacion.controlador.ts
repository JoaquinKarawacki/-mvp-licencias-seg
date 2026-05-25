import { Controller, Post, Body } from '@nestjs/common';
import { AutenticacionServicio } from './autenticacion.servicio';
import { LoginDto } from './dto/login.dto';

@Controller('autenticacion')
export class AutenticacionControlador {
  constructor(private readonly autenticacionServicio: AutenticacionServicio) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.autenticacionServicio.login(loginDto);
  }
}