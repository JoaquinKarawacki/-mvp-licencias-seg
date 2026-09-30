// formatearDias no usa ninguna dependencia inyectada; mockeamos el modulo de
// Prisma para no depender del cliente generado (y no necesitar una DB real).
jest.mock('../../../prisma/prisma.servicio', () => ({ PrismaServicio: jest.fn() }));

import { SolicitudesServicio } from './solicitud.servicio';

// formatearDias no toca ninguna dependencia inyectada (prisma, saldos, etc.),
// asi que la probamos sobre el prototipo sin construir el servicio completo.
function formatearDias(dias: { fecha: Date }[]): string {
  const servicio = Object.create(SolicitudesServicio.prototype) as {
    formatearDias: (dias: { fecha: Date }[]) => string;
  };
  return servicio.formatearDias(dias);
}

function fecha(iso: string) {
  return { fecha: new Date(`${iso}T00:00:00.000Z`) };
}

describe('SolicitudesServicio.formatearDias', () => {
  it('un solo dia', () => {
    expect(formatearDias([fecha('2026-07-06')])).toBe('06/07/2026');
  });

  it('2 dias consecutivos -> listado, no rango (regla: solo +3 consecutivos arma rango)', () => {
    expect(formatearDias([fecha('2026-07-06'), fecha('2026-07-07')])).toBe(
      '06/07/2026 y 07/07/2026',
    );
  });

  it('3 dias consecutivos -> listado, no rango', () => {
    expect(
      formatearDias([fecha('2026-07-06'), fecha('2026-07-07'), fecha('2026-07-08')]),
    ).toBe('06/07/2026, 07/07/2026 y 08/07/2026');
  });

  it('4 dias consecutivos -> rango', () => {
    expect(
      formatearDias([
        fecha('2026-07-06'),
        fecha('2026-07-07'),
        fecha('2026-07-08'),
        fecha('2026-07-09'),
      ]),
    ).toBe('06/07/2026 al 09/07/2026');
  });

  it('el caso del bug reportado: 3 dias salteados en la misma semana -> listado, NO rango', () => {
    expect(
      formatearDias([fecha('2026-07-06'), fecha('2026-07-08'), fecha('2026-07-10')]),
    ).toBe('06/07/2026, 08/07/2026 y 10/07/2026');
  });

  it('4 dias con un salto en el medio -> listado, no rango (no son TODOS consecutivos)', () => {
    expect(
      formatearDias([
        fecha('2026-07-06'),
        fecha('2026-07-07'),
        fecha('2026-07-09'),
        fecha('2026-07-10'),
      ]),
    ).toBe('06/07/2026, 07/07/2026, 09/07/2026 y 10/07/2026');
  });

  it('viernes + lunes salteando el fin de semana -> listado, no rango', () => {
    // el fin de semana no fue pedido, no tiene que aparecer como si lo fuera
    expect(formatearDias([fecha('2026-07-10'), fecha('2026-07-13')])).toBe(
      '10/07/2026 y 13/07/2026',
    );
  });

  it('ordena las fechas aunque lleguen desordenadas', () => {
    expect(
      formatearDias([fecha('2026-07-09'), fecha('2026-07-06'), fecha('2026-07-07'), fecha('2026-07-08')]),
    ).toBe('06/07/2026 al 09/07/2026');
  });

  it('rango que cruza fin de mes', () => {
    expect(
      formatearDias([
        fecha('2026-07-29'),
        fecha('2026-07-30'),
        fecha('2026-07-31'),
        fecha('2026-08-01'),
      ]),
    ).toBe('29/07/2026 al 01/08/2026');
  });

  it('caso real reportado: semana completa + 3 dias sueltos de la semana siguiente -> rango + listado combinados', () => {
    expect(
      formatearDias([
        fecha('2026-07-13'), // lun
        fecha('2026-07-14'), // mar
        fecha('2026-07-15'), // mie
        fecha('2026-07-16'), // jue
        fecha('2026-07-17'), // vie
        fecha('2026-07-20'), // lun (salta el fin de semana)
        fecha('2026-07-21'), // mar
        fecha('2026-07-22'), // mie
      ]),
    ).toBe('13/07/2026 al 17/07/2026, 20/07/2026, 21/07/2026 y 22/07/2026');
  });

  it('dos tramos largos separados -> dos rangos combinados', () => {
    expect(
      formatearDias([
        fecha('2026-07-06'),
        fecha('2026-07-07'),
        fecha('2026-07-08'),
        fecha('2026-07-09'),
        fecha('2026-07-20'),
        fecha('2026-07-21'),
        fecha('2026-07-22'),
        fecha('2026-07-23'),
      ]),
    ).toBe('06/07/2026 al 09/07/2026 y 20/07/2026 al 23/07/2026');
  });

  it('rango que cruza fin de anio', () => {
    expect(
      formatearDias([
        fecha('2026-12-29'),
        fecha('2026-12-30'),
        fecha('2026-12-31'),
        fecha('2027-01-01'),
      ]),
    ).toBe('29/12/2026 al 01/01/2027');
  });
});

describe('SolicitudesServicio.crear - regla del sabado por tipo de licencia', () => {
  // Empleado con la regla del sabado ACTIVADA, para que la diferencia por tipo
  // sea visible: en ESTUDIO se debe ignorar la regla (pasar false al calculador),
  // en el resto de los tipos se debe respetar el flag del empleado.
  const dias = ['2026-07-06', '2026-07-07', '2026-07-08']; // lun, mar, mie

  function armarServicio(codigoTipo: string) {
    const calcularDias = jest.fn().mockReturnValue(3);

    const prisma = {
      empleado: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          aplica_regla_sabado: true,
          usuario: { id: 10, email: 'empleado@test.com' },
          nombre: 'Test',
          apellido: 'Empleado',
        }),
      },
      tipoLicencia: {
        findUnique: jest.fn().mockResolvedValue({
          id: 2,
          codigo: codigoTipo,
          nombre: codigoTipo === 'ESTUDIO' ? 'Licencia de Estudio' : 'Licencia Comun',
        }),
      },
      diaSolicitado: { findFirst: jest.fn().mockResolvedValue(null) },
      feriado: { findMany: jest.fn().mockResolvedValue([]) },
      solicitudLicencia: {
        create: jest.fn().mockResolvedValue({ id: 99, dias: [] }),
      },
    };

    const servicio = new SolicitudesServicio(
      prisma as never,
      { calcularDias } as never,
      {} as never, // saldos: no se usa en crear
      { notificarNuevaSolicitud: jest.fn() } as never,
      { registrar: jest.fn().mockResolvedValue(undefined) } as never,
    );

    // buscarRevisor consulta la DB; lo cortamos (sin revisor no se manda mail).
    jest
      .spyOn(servicio as unknown as { buscarRevisor: () => Promise<null> }, 'buscarRevisor')
      .mockResolvedValue(null);

    return { servicio, calcularDias };
  }

  it('ESTUDIO: ignora la regla del sabado aunque el empleado la tenga activada (pasa false)', async () => {
    const { servicio, calcularDias } = armarServicio('ESTUDIO');

    await servicio.crear(10, { tipo_licencia_id: 2, dias } as never);

    expect(calcularDias).toHaveBeenCalledTimes(1);
    expect(calcularDias.mock.calls[0][2]).toBe(false);
  });

  it('COMUN: respeta la regla del sabado del empleado (pasa true)', async () => {
    const { servicio, calcularDias } = armarServicio('COMUN');

    await servicio.crear(10, { tipo_licencia_id: 2, dias } as never);

    expect(calcularDias).toHaveBeenCalledTimes(1);
    expect(calcularDias.mock.calls[0][2]).toBe(true);
  });
});
