// prisma/datosIniciales.data.example.ts
// Plantilla con datos FICTICIOS. Para seedear con datos reales:
//   1. Copiar este archivo a datosIniciales.data.ts (gitignoreado, nunca se commitea)
//   2. Reemplazar por los datos reales de la empresa
//   3. Correr: npx tsx prisma/datosIniciales.ts

export const SECTORES = [
  'ADMINISTRACIÓN',
  'VENTAS',
];

export const EMPLEADOS = [
  {
    nombre: 'Ana', apellido: 'Ejemplo',
    email: 'ana.ejemplo@empresa.com',
    fechaIngreso: '2020-03-15',
    sector: 'ADMINISTRACIÓN',
    esEncargado: true, esAdmin: false,
    esEstudiante: false, horasSemanales: 0,
    saldoComun: { totalDias: 20, diasAjustados: 0, diasUsados: 0 },
  },
  {
    nombre: 'Juan', apellido: 'Prueba',
    email: 'juan.prueba@empresa.com',
    fechaIngreso: '2023-01-01',
    sector: 'VENTAS',
    esEncargado: false, esAdmin: true,
    esEstudiante: true, horasSemanales: 40,
    saldoComun: { totalDias: 20, diasAjustados: 0, diasUsados: 0 },
    saldoEstudio: { totalDias: 9, diasAjustados: 0, diasUsados: 0 },
  },
];
