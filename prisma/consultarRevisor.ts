// prisma/consultarRevisor.ts
// Script de diagnóstico de solo lectura: muestra a quién le llegaría el mail
// de "nueva solicitud de licencia" para un empleado dado, replicando
// exactamente la lógica de buscarRevisor() en solicitud.servicio.ts.
// No escribe nada en la base (solo findUnique/findFirst).
//
// Ejecutar con: npx tsx prisma/consultarRevisor.ts [email]
// (default: perez@segingenieria.com)
// IMPORTANTE: correr con DATABASE_URL apuntando a la base que corresponda
// (Railway para producción, por ejemplo con `railway run`).

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function buscarRevisor(empleado: {
  id: number;
  sector_id: number;
  aprobador_id: number | null;
}) {
  return empleado.aprobador_id
    ? prisma.empleado.findUnique({
        where: { id: empleado.aprobador_id },
        include: { usuario: true },
      })
    : prisma.empleado.findFirst({
        where: {
          sector_id: empleado.sector_id,
          es_encargado: true,
          esta_activo: true,
          id: { not: empleado.id },
        },
        include: { usuario: true },
      });
}

async function main() {
  const email = process.argv[2] || 'perez@segingenieria.com';

  const empleado = await prisma.empleado.findFirst({
    where: { usuario: { email } },
    include: { usuario: true, sector: true },
  });

  if (!empleado) {
    console.error(`No se encontró ningún Empleado con email ${email}`);
    await pool.end();
    process.exit(1);
  }

  console.log(`Empleado: ${empleado.nombre} ${empleado.apellido} (${email})`);
  console.log(`  sector: ${empleado.sector.nombre} (id ${empleado.sector_id})`);
  console.log(`  aprobador_id: ${empleado.aprobador_id ?? 'null'}`);
  console.log(`  esta_activo: ${empleado.esta_activo}`);
  console.log('');

  const revisor = await buscarRevisor(empleado);

  if (!revisor) {
    console.log(
      '→ No se encontró revisor (ni aprobador_id, ni encargado activo en el sector). NO se enviaría ningún mail de "nueva solicitud".',
    );
  } else {
    const via = empleado.aprobador_id ? 'aprobador_id puntual' : 'encargado del sector (fallback)';
    console.log(`→ Destinatario ("To"): ${revisor.nombre} ${revisor.apellido} <${revisor.usuario.email}>`);
    console.log(`  resuelto vía: ${via}`);
  }

  const ccFijo = [process.env.MAIL_CC_1, process.env.MAIL_CC_2].filter(
    (e): e is string => !!e,
  );
  console.log('');
  console.log(`CC fijo (según env de este entorno): ${ccFijo.length ? ccFijo.join(', ') : '(ninguno)'}`);
  console.log(`Remitente (MAIL_FROM): ${process.env.MAIL_FROM ?? '(no seteado)'}`);

  await pool.end();
}

main().catch((e) => {
  console.error('Error consultando revisor:', e);
  process.exit(1);
});
