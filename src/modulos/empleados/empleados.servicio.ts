import { Injectable, ConflictException, NotFoundException, UnauthorizedException} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaServicio } from '../../prisma/prisma.servicio';
import { CrearEmpleadoDto } from './dto/crear-empleado.dto';
import { ActualizarEmpleadoDto } from './dto/actualizar-empleado.dto';
import { CambiarContraseniaDto } from './dto/cambiar-contrasenia.dto';
import { AuditoriaServicio } from '../auditoria/auditoria.servicio';

@Injectable()
export class EmpleadosServicio {
  constructor(
    private readonly prisma: PrismaServicio,
    private readonly auditoria: AuditoriaServicio,
  ) {}

  async crear(
    crearEmpleadoDto: CrearEmpleadoDto,
    usuarioId: number,
    usuarioEmail: string,
  ) {
    const { email, contrasena, nombre, apellido, fecha_ingreso, sector_id, es_encargado, es_estudiante, horas_semanales, aplica_regla_sabado } = crearEmpleadoDto;

    const emailUtilizado = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (emailUtilizado) {
      throw new ConflictException('El email ya estÃ¡ en uso');
    }

    const sectorExistente = await this.prisma.sector.findUnique({
      where: { id: sector_id },
    });

    if (!sectorExistente) {
      throw new NotFoundException('El sector no existe');
    }

    const hashContrasena = await bcrypt.hash(contrasena, 10);

    const resultado = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email,
          hash_contrasena: hashContrasena,
          rol: 'EMPLEADO',
        },
      });

      const empleado = await tx.empleado.create({
        data: {
          nombre,
          apellido,
          fecha_ingreso: new Date(fecha_ingreso),
          es_encargado: es_encargado ?? false,
          sector_id,
          usuario_id: usuario.id,
          es_estudiante: es_estudiante ?? false,
          horas_semanales: horas_semanales ?? 0,
          aplica_regla_sabado: aplica_regla_sabado ?? true,
        },
      });

      return { ...empleado, email: usuario.email, rol: usuario.rol };
    });

    await this.auditoria.registrar({
      usuario_id: usuarioId,
      usuario_email: usuarioEmail,
      accion: 'EMPLEADO_CREADO',
      descripcion: `CreÃ³ al empleado ${nombre} ${apellido} (${email})`,
      entidad: 'EMPLEADO',
      entidad_id: resultado.id,
    });

    return resultado;
  }

  async obtenerTodos() {
    return this.prisma.empleado.findMany({
      include: {
        usuario: {
          select: { email: true, rol: true },
        },
        sector: {
          select: { nombre: true },
        },
      },
    });
  }

  async obtenerUno(id: number) {
     const empleado = await this.prisma.empleado.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { email: true, rol: true },
        },
        sector: {
          select: { nombre: true },
        },
      },
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }

    return empleado;
  }

  async obtenerPerfil(usuarioId: number) {
    const empleado = await this.prisma.empleado.findUnique({
      where: { usuario_id: usuarioId },
      include: {
        usuario: {
          select: { email: true, rol: true },
        },
        sector: {
          select: { nombre: true },
        },
      },
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }

    return empleado;
  }

  async actualizar(
    id: number,
    actualizarEmpleadoDto: ActualizarEmpleadoDto,
    usuarioId: number,
    usuarioEmail: string,
  ) {
    const empleadoExistente = await this.prisma.empleado.findUnique({
      where: { id },
    });

    if (!empleadoExistente) {
      throw new NotFoundException('Empleado no encontrado');
    }

    if (actualizarEmpleadoDto.email) {
      const emailUtilizado = await this.prisma.usuario.findFirst({
        where: {
          email: actualizarEmpleadoDto.email,
          NOT: { id: empleadoExistente.usuario_id },
        },
      });

      if (emailUtilizado) {
        throw new ConflictException('El email ya estÃ¡ en uso');
      }
    }

    if (actualizarEmpleadoDto.sector_id) {
      const sectorExistente = await this.prisma.sector.findUnique({
        where: { id: actualizarEmpleadoDto.sector_id },
      });

      if (!sectorExistente) {
        throw new NotFoundException('El sector no existe');
      }
    }

    const actualizado = await this.prisma.$transaction(async (tx) => {
      const { email, contrasena, esta_activo, fecha_ingreso, ...datosEmpleado } = actualizarEmpleadoDto;

      if (email) {
        await tx.usuario.update({
          where: { id: empleadoExistente.usuario_id },
          data: { email },
        });
      }

      if (contrasena) {
        const hashContrasena = await bcrypt.hash(contrasena, 10);
        await tx.usuario.update({
          where: { id: empleadoExistente.usuario_id },
          data: { hash_contrasena: hashContrasena },
        });
      }

      if (esta_activo !== undefined) {
        await tx.usuario.update({
          where: { id: empleadoExistente.usuario_id },
          data: { esta_activo },
        });
      }

      return tx.empleado.update({
        where: { id },
        data: {
          ...datosEmpleado,
          ...(fecha_ingreso && { fecha_ingreso: new Date(fecha_ingreso) }),
          ...(esta_activo !== undefined && { esta_activo }),
        },
      });
    });

    await this.auditoria.registrar({
      usuario_id: usuarioId,
      usuario_email: usuarioEmail,
      accion: 'EMPLEADO_ACTUALIZADO',
      descripcion: `EditÃ³ al empleado ${actualizado.nombre} ${actualizado.apellido}`,
      entidad: 'EMPLEADO',
      entidad_id: actualizado.id,
    });

    return actualizado;
  }
  
  async cambiarContrasenia(usuarioId:number, dto: CambiarContraseniaDto) {
    const empleado = await this.prisma.empleado.findUnique({
      where: { usuario_id: usuarioId },
      include: { usuario: true },
    });
    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }
    const { contrasena_actual, contrasena_nueva } = dto;
    const passwordMatch = await bcrypt.compare(contrasena_actual, empleado.usuario.hash_contrasena);
    if (!passwordMatch) {
      throw new UnauthorizedException('La contraseÃ±a actual es incorrecta');
    }
    const hashContrasena = await bcrypt.hash(contrasena_nueva, 10);
    
    await this.prisma.usuario.update({
          where: { id: empleado.usuario_id },
          data: { hash_contrasena: hashContrasena },
        });

      await this.auditoria.registrar({
        usuario_id: empleado.usuario.id,
        usuario_email: empleado.usuario.email,
        accion: 'CONTRASENIA_CAMBIADA',
        descripcion: `CambiÃ³ su contraseÃ±a`,
        entidad: 'EMPLEADO',
        entidad_id: empleado.id,
      });

    return { mensaje: 'ContraseÃ±a actualizada correctamente' };

  }
  
}

