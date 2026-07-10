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
