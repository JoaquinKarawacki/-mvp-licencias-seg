import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decoradores/roles.decorador';

@Injectable()
export class RolesGuardia implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (!rolesRequeridos) {
      return true;
    }

    const { user } = contexto.switchToHttp().getRequest();

    const tieneRol = rolesRequeridos.includes(user.rol);

    if (!tieneRol) {
      throw new ForbiddenException('No tenés permisos para acceder a este recurso');
    }

    return tieneRol;
  }
}