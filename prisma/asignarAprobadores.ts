// prisma/asignarAprobadores.ts
// Script de una sola vez: crea el sector "Dirección" con los 3 dueños de la
// empresa y les asigna como aprobador puntual a los encargados de sector que
// les reportan a cada uno.
//
// Ejecutar con: npx tsx prisma/asignarAprobadores.ts
// IMPORTANTE: correr con DATABASE_URL apuntando a la base que corresponda
// (Railway para producción).

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const CONTRASENA_INICIAL = 'Licencias2026';
const SECTOR_DIRECCION = 'Dirección';

const DUENIOS = [
  {
    nombre: 'Marcelo',
    apellido: 'Garfinkel',
    email: 'garfinkel@segingenieria.com',
    aprueba: ['gonzalez@segheliotec.com'],
  },
  {
    nombre: 'M.',
    apellido: 'Gonzalez',
    email: 'mgonzalez@segingenieria.com',
    aprueba: [
      'calosso@segingenieria.com',
      'obrusnik@segingenieria.com',
      'baccino@segingenieria.com',
      'rodriguez@segingenieria.com',
      'deconto@segingenieria.com',
    ],
  },
  {
    nombre: 'Fernando',
    apellido: 'Schaich',
    email: 'schaich@segingenieria.com',
    aprueba: ['piedracueva@segingenieria.com'],
  },
];

async function main() {
  console.log('Asignando aprobadores...\n');

  const hash = await bcrypt.hash(CONTRASENA_INICIAL, 10);
  const hoy = new Date();

  const sector = await prisma.sector.upsert({
    where: { nombre: SECTOR_DIRECCION },
    update: {},
    create: { nombre: SECTOR_DIRECCION },
  });
  console.log(`Sector "${SECTOR_DIRECCION}" listo (id ${sector.id})`);

  for (const duenio of DUENIOS) {
    const usuario = await prisma.usuario.create({
      data: {
        email: duenio.email,
        hash_contrasena: hash,
        rol: 'EMPLEADO',
      },
    });

    const empleado = await prisma.empleado.create({
      data: {
        nombre: duenio.nombre,
        apellido: duenio.apellido,
        fecha_ingreso: hoy,
        es_encargado: false,
        sector_id: sector.id,
        usuario_id: usuario.id,
      },
    });

    console.log(`  ✓ ${duenio.nombre} ${duenio.apellido} (${duenio.email})`);

    for (const emailEncargado of duenio.aprueba) {
      const encargado = await prisma.empleado.findFirst({
        where: { usuario: { email: emailEncargado } },
      });

      if (!encargado) {
        console.error(`    ✗ No se encontró al encargado ${emailEncargado}`);
        continue;
      }

      await prisma.empleado.update({
        where: { id: encargado.id },
        data: { aprobador_id: empleado.id },
      });

      console.log(`    → ${emailEncargado} ahora reporta a ${duenio.email}`);
    }
  }

  console.log(`\n──────────────────────────────────────`);
  console.log(`Listo. Contraseña inicial de los 3 dueños: ${CONTRASENA_INICIAL}`);
  console.log(`──────────────────────────────────────`);

  await pool.end();
}

main().catch((e) => {
  console.error('Error asignando aprobadores:', e);
  process.exit(1);
});
