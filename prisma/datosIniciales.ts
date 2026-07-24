// prisma/seed.ts
// Ejecutar con: npx ts-node prisma/seed.ts
// IMPORTANTE: correr DESPUÉS de `npx prisma migrate reset`
//
// Los datos reales (nombres, emails, saldos) NO viven en este archivo —
// están en prisma/datosIniciales.data.ts (gitignoreado, nunca se commitea).
// Si no existe, copiar prisma/datosIniciales.data.example.ts y completar.

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcryptjs';
import { SECTORES, EMPLEADOS } from './datosIniciales.data';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const CONTRASENA_INICIAL = 'Licencias2026';
const ANIO = 2026;

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Iniciando seed...\n');

  const hash = await bcrypt.hash(CONTRASENA_INICIAL, 10);

  // 1. Sectores
  console.log('Creando sectores...');
  const sectoresMap: Record<string, number> = {};
  for (const nombre of SECTORES) {
    const s = await prisma.sector.create({ data: { nombre } });
    sectoresMap[nombre] = s.id;
    console.log(`  ✓ ${nombre}`);
  }

  // 2. Tipos de licencia
  console.log('\nCreando tipos de licencia...');
  const tipoComun = await prisma.tipoLicencia.create({
    data: {
      nombre: 'Licencia Común',
      codigo: 'COMUN',
      requiere_saldo: true,
      esta_activo: true,
    },
  });
  const tipoEstudio = await prisma.tipoLicencia.create({
    data: {
      nombre: 'Licencia de Estudio',
      codigo: 'ESTUDIO',
      requiere_saldo: true,
      esta_activo: true,
      descripcion: 'Para empleados que estudian',
    },
  });
  console.log('  ✓ COMUN');
  console.log('  ✓ ESTUDIO');

  // 3. Empleados, usuarios y saldos
  console.log('\nCreando empleados...');
  let creados = 0;

  for (const e of EMPLEADOS) {
    const sectorId = sectoresMap[e.sector];
    if (!sectorId) {
      console.error(`  ✗ Sector no encontrado: ${e.sector} (${e.nombre} ${e.apellido})`);
      continue;
    }

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        email: e.email,
        hash_contrasena: hash,
        rol: e.esAdmin ? 'ADMIN' : 'EMPLEADO',
        esta_activo: true,
      },
    });

    // Crear empleado
    const empleado = await prisma.empleado.create({
      data: {
        nombre: e.nombre,
        apellido: e.apellido,
        fecha_ingreso: new Date(e.fechaIngreso),
        es_encargado: e.esEncargado,
        es_estudiante: e.esEstudiante,
        horas_semanales: e.horasSemanales,
        sector_id: sectorId,
        usuario_id: usuario.id,
        esta_activo: true,
      },
    });

    // Saldo licencia común 2026
    await prisma.saldoLicencia.create({
      data: {
        empleado_id: empleado.id,
        tipo_licencia_id: tipoComun.id,
        anio: ANIO,
        total_dias: e.saldoComun.totalDias,
        dias_ajustados: e.saldoComun.diasAjustados,
        dias_usados: e.saldoComun.diasUsados,
      },
    });

    // Saldo licencia de estudio 2026 (si aplica)
    if (e.saldoEstudio) {
      await prisma.saldoLicencia.create({
        data: {
          empleado_id: empleado.id,
          tipo_licencia_id: tipoEstudio.id,
          anio: ANIO,
          total_dias: e.saldoEstudio.totalDias,
          dias_ajustados: e.saldoEstudio.diasAjustados,
          dias_usados: e.saldoEstudio.diasUsados,
        },
      });
    }

    const rol = e.esAdmin ? ' [ADMIN]' : '';
    const enc = e.esEncargado ? ' [encargado]' : '';
    console.log(`  ✓ ${e.nombre} ${e.apellido}${rol}${enc}`);
    creados++;
  }

  console.log(`\n──────────────────────────────────────`);
  console.log(`Seed completado. ${creados} empleados creados.`);
  console.log(`Contraseña inicial: ${CONTRASENA_INICIAL}`);
  console.log(`Admins: karawacki@segingenieria.com, soto@segingenieria.com`);
  console.log(`──────────────────────────────────────`);

  await pool.end();
}

main().catch((e) => {
  console.error('Error en el seed:', e);
  process.exit(1);
});
