// prisma/asignarAprobadorPerez.ts
// Script de una sola vez: asigna a mgonzalez@segingenieria.com como
// aprobador puntual (Empleado.aprobador_id) de perez@segingenieria.com,
// que quedó sin revisor (sin aprobador_id y sin encargado activo en su
// sector INDICADORES) — ver diagnóstico con prisma/consultarRevisor.ts.
//
// Ejecutar con: npx tsx prisma/asignarAprobadorPerez.ts
// IMPORTANTE: correr con DATABASE_URL apuntando a la base que corresponda
// (Railway para producción).

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const EMAIL_EMPLEADO = 'perez@segingenieria.com';
const EMAIL_APROBADOR = 'mgonzalez@segingenieria.com';

async function main() {
  const empleado = await prisma.empleado.findFirst({
    where: { usuario: { email: EMAIL_EMPLEADO } },
  });
  if (!empleado) {
    console.error(`No se encontró Empleado con email ${EMAIL_EMPLEADO}`);
    process.exit(1);
  }

  const aprobador = await prisma.empleado.findFirst({
    where: { usuario: { email: EMAIL_APROBADOR } },
  });
  if (!aprobador) {
    console.error(`No se encontró Empleado con email ${EMAIL_APROBADOR}`);
    process.exit(1);
  }

  const actualizado = await prisma.empleado.update({
    where: { id: empleado.id },
    data: { aprobador_id: aprobador.id },
  });

  console.log(
    `✓ ${empleado.nombre} ${empleado.apellido} (${EMAIL_EMPLEADO}) ahora tiene como aprobador a ${aprobador.nombre} ${aprobador.apellido} (${EMAIL_APROBADOR})`,
  );
  console.log(`  aprobador_id: ${actualizado.aprobador_id}`);

  await pool.end();
}

main().catch((e) => {
  console.error('Error asignando aprobador:', e);
  process.exit(1);
});
