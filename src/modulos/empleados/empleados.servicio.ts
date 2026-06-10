import { Injectable, ConflictException, NotFoundException, UnauthorizedException} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaServicio } from '../../prisma/prisma.servicio';
import { CrearEmpleadoDto } from './dto/crear-empleado.dto';
import { ActualizarEmpleadoDto } from './dto/actualizar-empleado.dto';
import { CambiarContraseniaDto } from './dto/cambiar-contrasenia.dto';

@Injectable()
export class EmpleadosServicio {
  constructor(private readonly prisma: PrismaServicio) {}

  async crear(crearEmpleadoDto: CrearEmpleadoDto) {
    const { email, contrasena, nombre, apellido, fecha_ingreso, sector_id, es_encargado, es_estudiante, horas_semanales } = crearEmpleadoDto;

    const emailUtilizado = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (emailUtilizado) {
      throw new ConflictException('El email ya está en uso');
    }

    const sectorExistente = await this.prisma.sector.findUnique({
      where: { id: sector_id },
    });

    if (!sectorExistente) {
      throw new NotFoundException('El sector no existe');
    }

    const hashContrasena = await bcrypt.hash(contrasena, 10);

    return this.prisma.$transaction(async (tx) => {
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
        },
      });

      return { ...empleado, email: usuario.email, rol: usuario.rol };
    });
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

  async actualizar(id: number, actualizarEmpleadoDto: ActualizarEmpleadoDto) {
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
        throw new ConflictException('El email ya está en uso');
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

  return this.prisma.$transaction(async (tx) => {
  const { email, contrasena, esta_activo, ...datosEmpleado } = actualizarEmpleadoDto;

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

  // Armamos el objeto a guardar, convirtiendo la fecha si vino
 const datosAGuardar = {
    ...datosEmpleado,
    ...(datosEmpleado.fecha_ingreso && {
      fecha_ingreso: new Date(datosEmpleado.fecha_ingreso),
    }),
    ...(esta_activo !== undefined && { esta_activo }),  // ← mismo nivel
  };

  return tx.empleado.update({
    where: { id },
    data: datosAGuardar,
  });
  });
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
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }
    const hashContrasena = await bcrypt.hash(contrasena_nueva, 10);
    
    await this.prisma.usuario.update({
        where: { id: empleado.usuario_id },
        data: { hash_contrasena: hashContrasena },
      });

    return { mensaje: 'Contraseña actualizada correctamente' };

  }
  
}
