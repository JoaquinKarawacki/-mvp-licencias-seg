// prisma/seed.ts
// Ejecutar con: npx ts-node prisma/seed.ts
// IMPORTANTE: correr DESPUÉS de `npx prisma migrate reset`

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const CONTRASENA_INICIAL = 'Licencias2026'; 
const ANIO = 2026;

// ─── SECTORES ────────────────────────────────────────────────────────────────
const SECTORES = [
  'ADMINISTRACIÓN',
  'AE',
  'ECR',
  'HELIOTEC',
  'RENOVABLES',
  'INDICADORES',
  'VENTAS',
  'CONSULTING',
];

// ─── EMPLEADOS ───────────────────────────────────────────────────────────────
// Los saldos se cargan con los valores exactos de la planilla Excel (estado al 10/06/2026).
// SI (saldo inicial) = días arrastrados de 2025 → va en diasAjustados.
// diasUsados = suma de días tomados en 2026 extraída de las columnas mensuales de la planilla.
// Disponible resultante = totalDias + diasAjustados - diasUsados (coincide con columna SF de la planilla).
//
// Empleados PENDIENTES de confirmar con RRHH (NO incluidos):
//   - Ignacio Tassanni (02/04/2025)
//   - Hernandez Juan Martin (13/09/2022)
//   - Alba, Manuel (23/10/2023)
//   - Porro, Victoria (08/01/2020)
//   - Ramiro Torres (en planilla pero sin fecha de ingreso confirmada)

const EMPLEADOS = [

  // ── ADMINISTRACIÓN ──────────────────────────────────────────────────────────
  {
    nombre: 'Lorena', apellido: 'Albornoz',
    email: 'albornoz@segingenieria.com',
    fechaIngreso: '2014-06-16',
    sector: 'ADMINISTRACIÓN',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 22, diasAjustados:  8, diasUsados: 23 },
  },
  {
    nombre: 'Franco', apellido: 'Rodriguez',
    email: 'rodriguez@segingenieria.com',
    fechaIngreso: '2023-01-09',
    sector: 'ADMINISTRACIÓN',
    esEncargado: true, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 20, diasAjustados: 10, diasUsados:  8 },
  },
  {
    // ADMIN (RRHH) — aparece como supervisor en todos los sectores de la planilla
    nombre: 'Jeyckerson', apellido: 'Soto',
    email: 'soto@segingenieria.com',
    fechaIngreso: '2025-01-06',
    sector: 'ADMINISTRACIÓN',
    esEncargado: false, esAdmin: true,
    esEstudiante: true, horasSemanales: 40,
    saldoComun:   { totalDias: 20, diasAjustados: -1, diasUsados: 12 },
    saldoEstudio: { totalDias:  9, diasAjustados:  0, diasUsados:  1 },
  },
  {
    nombre: 'Mateo', apellido: 'Marichal',
    email: 'marichal@segingenieria.com',
    fechaIngreso: '2026-01-19',
    sector: 'ADMINISTRACIÓN',
    esEncargado: false, esAdmin: false,
    esEstudiante: true, horasSemanales: 40,
    // totalDias=0: ingresó este año, RRHH lo regenerará cuando corresponda
    saldoComun:   { totalDias:  0, diasAjustados:  0, diasUsados:  1 },
    saldoEstudio: { totalDias:  9, diasAjustados:  0, diasUsados:  2 },
  },
  {
    nombre: 'Paola', apellido: 'Acosta',
    email: 'acosta@segingenieria.com',
    fechaIngreso: '2019-05-27',
    sector: 'ADMINISTRACIÓN',
    esEncargado: false, esAdmin: false,
    esEstudiante: true, horasSemanales: 40,
    saldoComun:   { totalDias: 21, diasAjustados:  3, diasUsados: 18 },
    saldoEstudio: { totalDias:  9, diasAjustados:  0, diasUsados:  0 },
  },

  // ── AE ──────────────────────────────────────────────────────────────────────
  {
    nombre: 'Santiago', apellido: 'Gibert',
    email: 'gibert@segingenieria.com',
    fechaIngreso: '2022-03-22',
    sector: 'AE',
    esEncargado: false, esAdmin: false,
    esEstudiante: true, horasSemanales: 36,
    saldoComun:   { totalDias: 20, diasAjustados: 32, diasUsados: 19 },
    saldoEstudio: { totalDias:  6, diasAjustados:  0, diasUsados:  6 },
  },
  {
    nombre: 'Daniel', apellido: 'Salomone',
    email: 'salomone@segingenieria.com',
    fechaIngreso: '2010-09-01',
    sector: 'AE',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 23, diasAjustados: 11, diasUsados: 15 },
  },
  {
    nombre: 'Marcelo', apellido: 'Calosso',
    email: 'calosso@segingenieria.com',
    fechaIngreso: '2009-04-10',
    sector: 'AE',
    esEncargado: true, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 24, diasAjustados: 38, diasUsados: 14 },
  },
  {
    nombre: 'Ramiro', apellido: 'Sanes',
    email: 'sanes@segingenieria.com',
    fechaIngreso: '2025-06-04',
    sector: 'AE',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 12, diasAjustados:  0, diasUsados:  3 },
  },
  {
    nombre: 'Noelia', apellido: 'Andrade',
    email: 'andrade@segingenieria.com',
    fechaIngreso: '2011-09-27',
    sector: 'AE',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 23, diasAjustados:  6, diasUsados: 19 },
  },
  {
    nombre: 'Manuel', apellido: 'Martinez',
    email: 'martinez@segingenieria.com',
    fechaIngreso: '2019-07-08',
    sector: 'AE',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 21, diasAjustados: 30, diasUsados: 19 },
  },
  {
    nombre: 'Leonor', apellido: 'Bentancour',
    email: 'bentancour@segingenieria.com',
    fechaIngreso: '2023-04-19',
    sector: 'AE',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 20, diasAjustados: 11, diasUsados:  7 },
  },
  {
    nombre: 'Matias', apellido: 'Olivera',
    email: 'olivera@segingenieria.com',
    fechaIngreso: '2021-04-01',
    sector: 'AE',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 21, diasAjustados: 13, diasUsados:  8 },
  },
  {
    nombre: 'Andres', apellido: 'Diaz',
    email: 'diaz@segingenieria.com',
    fechaIngreso: '2024-09-01',
    sector: 'AE',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 20, diasAjustados: -2, diasUsados:  9 },
  },
  {
    nombre: 'Tabare', apellido: 'Vazquez',
    email: 'vazquez@segingenieria.com',
    fechaIngreso: '2024-11-20',
    sector: 'AE',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 20, diasAjustados:  1, diasUsados: 13 },
  },
  {
    // ADMIN — desarrollador del sistema
    nombre: 'Joaquín', apellido: 'Karawacki',
    email: 'karawacki@segingenieria.com',
    fechaIngreso: '2025-11-19',
    sector: 'AE',
    esEncargado: false, esAdmin: true,
    esEstudiante: true, horasSemanales: 36,
    saldoComun:   { totalDias:  2, diasAjustados:  0, diasUsados:  0 },
    saldoEstudio: { totalDias:  6, diasAjustados:  0, diasUsados:  1 },
  },

  // ── ECR ─────────────────────────────────────────────────────────────────────
  {
    nombre: 'Marcel', apellido: 'Vivensang',
    email: 'vivensang@segingenieria.com',
    fechaIngreso: '2002-04-01',
    sector: 'ECR',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 25, diasAjustados:  6, diasUsados:  7 },
  },
  {
    nombre: 'Maciel', apellido: 'De Conto',
    email: 'deconto@segingenieria.com',
    fechaIngreso: '2009-04-08',
    sector: 'ECR',
    esEncargado: true, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 24, diasAjustados: 10, diasUsados: 12 },
  },
  {
    nombre: 'Enzo', apellido: 'Costanzo',
    email: 'costanzo@segingenieria.com',
    fechaIngreso: '2025-09-30',
    sector: 'ECR',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias:  5, diasAjustados:  0, diasUsados:  0 },
  },

  // ── HELIOTEC ─────────────────────────────────────────────────────────────────
  {
    nombre: 'Diego', apellido: 'Quiroga',
    email: 'quiroga@segheliotec.com',
    fechaIngreso: '2022-07-19',
    sector: 'HELIOTEC',
    esEncargado: false, esAdmin: false,
    esEstudiante: true, horasSemanales: 40,
    saldoComun:   { totalDias: 20, diasAjustados: 19, diasUsados:  0 },
    saldoEstudio: { totalDias:  9, diasAjustados:  0, diasUsados:  2 },
  },
  {
    nombre: 'Tobias', apellido: 'Rivas',
    email: 'rivas@segheliotec.com',
    fechaIngreso: '2017-08-01',
    sector: 'HELIOTEC',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 22, diasAjustados:  9, diasUsados: 14 },
  },
  {
    // OJO: hay dos Gonzalez. Este es Joaquin (HELIOTEC) → gonzalez@
    // Federico (CONSULTING) → gonzalezf@ (confirmar si el email real es distinto)
    nombre: 'Joaquin', apellido: 'Gonzalez',
    email: 'gonzalez@segheliotec.com',
    fechaIngreso: '2022-09-16',
    sector: 'HELIOTEC',
    esEncargado: true, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 20, diasAjustados: 11, diasUsados:  0 },
  },
  {
  nombre: 'Ramiro', apellido: 'Torres',
  email: 'torres@segheliotec.com',
  fechaIngreso: '2026-02-10',
  sector: 'HELIOTEC',
  esEncargado: false, esAdmin: false,
  esEstudiante: true, horasSemanales: 36,
  // Entró en 2026: totalDias=0 igual que Marichal, RRHH regenera cuando corresponda
  saldoComun:   { totalDias: 0, diasAjustados: 0, diasUsados: 0 },
  saldoEstudio: { totalDias: 6, diasAjustados: 0, diasUsados: 0 },
},

  // ── RENOVABLES ───────────────────────────────────────────────────────────────
  {
    nombre: 'Augusto', apellido: 'Lanza',
    email: 'lanza@segingenieria.com',
    fechaIngreso: '2014-04-09',
    sector: 'RENOVABLES',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 22, diasAjustados: 10, diasUsados:  4 },
  },
  {
    nombre: 'Martin', apellido: 'Piedra Cueva',
    email: 'piedracueva@segingenieria.com',
    fechaIngreso: '2014-09-02',
    sector: 'RENOVABLES',
    esEncargado: true, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 22, diasAjustados:  7, diasUsados: 15 },
  },
  {
    nombre: 'Marcelo', apellido: 'Foglino',
    email: 'foglino@segingenieria.com',
    fechaIngreso: '2011-11-01',
    sector: 'RENOVABLES',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 23, diasAjustados: 10, diasUsados: 15 },
  },

  // ── INDICADORES ─────────────────────────────────────────────────────────────
  {
    // Sin encargado asignado en la planilla — confirmar con RRHH quién aprueba
    nombre: 'Germán', apellido: 'Perez',
    email: 'perez@segingenieria.com',
    fechaIngreso: '2017-03-02',
    sector: 'INDICADORES',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 21, diasAjustados: 32, diasUsados:  8 },
  },

  // ── VENTAS ───────────────────────────────────────────────────────────────────
  {
    nombre: 'Leonardo', apellido: 'De Leon',
    email: 'deleon@segingenieria.com',
    fechaIngreso: '2007-10-30',
    sector: 'VENTAS',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 24, diasAjustados:  8, diasUsados: 18 },
  },
  {
    nombre: 'Sheila', apellido: 'Olsen',
    email: 'olsen@segingenieria.com',
    fechaIngreso: '2016-08-02',
    sector: 'VENTAS',
    esEncargado: false, esAdmin: false,
    esEstudiante: true, horasSemanales: 40,
    saldoComun:   { totalDias: 22, diasAjustados:  7, diasUsados: 21 },
    saldoEstudio: { totalDias:  9, diasAjustados:  0, diasUsados:  0 },
  },
  {
    nombre: 'Emiliano', apellido: 'Alanis',
    email: 'alanis@segingenieria.com',
    fechaIngreso: '2024-10-04',
    sector: 'VENTAS',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 20, diasAjustados:  1, diasUsados: 16 },
  },
  {
    nombre: 'Santiago', apellido: 'Nuñez',
    email: 'nunez@segingenieria.com',
    fechaIngreso: '2002-04-01',
    sector: 'VENTAS',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 25, diasAjustados: -5, diasUsados:  7 },
  },
  {
    nombre: 'Sebastián', apellido: 'Baccino',
    email: 'baccino@segingenieria.com',
    fechaIngreso: '2009-07-01',
    sector: 'VENTAS',
    esEncargado: true, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 26, diasAjustados: -16, diasUsados: 22 },
  },
  {
    nombre: 'Haroldo', apellido: 'Albanell',
    email: 'albanell@segingenieria.com',
    fechaIngreso: '1997-01-01',
    sector: 'VENTAS',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 27, diasAjustados: 14, diasUsados: 15 },
  },

  // ── CONSULTING ───────────────────────────────────────────────────────────────
  {
    // OJO: email provisional gonzalezf@ por conflicto con Gonzalez Joaquin (HELIOTEC)
    nombre: 'Federico', apellido: 'Gonzalez',
    email: 'gonzalez@segingenieria.com',
    fechaIngreso: '2021-08-30',
    sector: 'CONSULTING',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 20, diasAjustados:  2, diasUsados:  7 },
  },
  {
    nombre: 'Andres', apellido: 'Sarachick',
    email: 'sarachick@segingenieria.com',
    fechaIngreso: '2022-06-01',
    sector: 'CONSULTING',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 20, diasAjustados: 10, diasUsados: 21 },
  },
  {
    nombre: 'Alvaro', apellido: 'Suttner',
    email: 'suttner@segingenieria.com',
    fechaIngreso: '2021-07-28',
    sector: 'CONSULTING',
    esEncargado: false, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 20, diasAjustados: -2, diasUsados: 10 },
  },
  {
    nombre: 'Nicolas', apellido: 'Obrusnik',
    email: 'obrusnik@segingenieria.com',
    fechaIngreso: '2010-04-01',
    sector: 'CONSULTING',
    esEncargado: true, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun:   { totalDias: 23, diasAjustados: 23, diasUsados: 21 },
  },
];

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
