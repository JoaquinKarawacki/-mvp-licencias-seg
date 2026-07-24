// prisma/agregarDuenioElenter.ts
// Script de una sola vez: agrega a Ernesto Elenter como 4to dueño de la
// empresa (sector "Dirección", rol ADMIN), sin subordinados asignados
// todavía (aprobador_id se carga más adelante cuando se decida a quién
// aprueba).
//
// Ejecutar con: npx tsx prisma/agregarDuenioElenter.ts
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

async function main() {
  const hash = await bcrypt.hash(CONTRASENA_INICIAL, 10);

  const sector = await prisma.sector.upsert({
    where: { nombre: SECTOR_DIRECCION },
    update: {},
    create: { nombre: SECTOR_DIRECCION },
  });
  console.log(`Sector "${SECTOR_DIRECCION}" listo (id ${sector.id})`);

  const usuario = await prisma.usuario.create({
    data: {
      email: 'elenter@segingenieria.com',
      hash_contrasena: hash,
      // ADMIN: igual que los otros 3 dueños, acceso completo al panel de
      // administración además de poder aprobar vía aprobador_id.
      rol: 'ADMIN',
    },
  });

  await prisma.empleado.create({
    data: {
      nombre: 'Ernesto',
      apellido: 'Elenter',
      fecha_ingreso: new Date(),
      es_encargado: false,
      sector_id: sector.id,
      usuario_id: usuario.id,
    },
  });

  console.log(`\n──────────────────────────────────────`);
  console.log(`Ernesto Elenter creado (${usuario.email})`);
  console.log(`Contraseña inicial: ${CONTRASENA_INICIAL}`);
  console.log(`──────────────────────────────────────`);

  await pool.end();
}

main().catch((e) => {
  console.error('Error creando a Ernesto Elenter:', e);
  process.exit(1);
});
