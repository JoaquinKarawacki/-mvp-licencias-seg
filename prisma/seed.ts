import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seed...');

  const sector = await prisma.sector.upsert({
    where: { nombre: 'RRHH' },
    update: {},
    create: { nombre: 'RRHH' },
  });

  console.log('Sector creado:', sector.nombre);

  const hashContrasena = await bcrypt.hash('admin123', 10);

  const usuarioAdmin = await prisma.usuario.upsert({
    where: { email: 'admin@seg.com' },
    update: {},
    create: {
      email: 'admin@seg.com',
      hash_contrasena: hashContrasena,
      rol: 'ADMIN',
      esta_activo: true,
      empleado: {
        create: {
          nombre: 'Admin',
          apellido: 'SEG',
          fecha_ingreso: new Date(),
          es_encargado: false,
          esta_activo: true,
          sector_id: sector.id,
        },
      },
    },
  });

  console.log('Usuario admin creado:', usuarioAdmin.email);

  const hashContrasenaEmpleado = await bcrypt.hash('empleado123', 10);

  const usuarioEmpleado = await prisma.usuario.upsert({
    where: { email: 'empleado@seg.com' },
    update: {},
    create: {
      email: 'empleado@seg.com',
      hash_contrasena: hashContrasenaEmpleado,
      rol: 'EMPLEADO',
      esta_activo: true,
      empleado: {
        create: {
          nombre: 'Juan',
          apellido: 'Pérez',
          fecha_ingreso: new Date(),
          es_encargado: false,
          esta_activo: true,
          sector_id: sector.id,
        },
      },
    },
  });

  console.log('Usuario empleado creado:', usuarioEmpleado.email);
  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });