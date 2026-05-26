import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaServicio } from '../../prisma/prisma.servicio';
import { CrearEmpleadoDto } from './dto/crear-empleado.dto';
import { ActualizarEmpleadoDto } from './dto/actualizar-empleado.dto';

@Injectable()
export class EmpleadosServicio {
  constructor(private readonly prisma: PrismaServicio) {}

  async crear(crearEmpleadoDto: CrearEmpleadoDto) {
    const { email, contrasena, nombre, apellido, fecha_ingreso, sector_id, es_encargado } = crearEmpleadoDto;

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
  const { email, contrasena, ...datosEmpleado } = actualizarEmpleadoDto;

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

    return tx.empleado.update({
      where: { id },
      data: datosEmpleado,
    });
    });
  }
}
