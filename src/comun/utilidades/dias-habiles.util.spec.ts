import {
  esFinDeSemana,
  esFeriado,
  esDiaLaboral,
  proximoDiaHabil,
  diaHabilAnterior,
  seCumplioHorarioMontevideo,
  FeriadoLike,
} from './dias-habiles.util';

const fecha = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('esFinDeSemana', () => {
  it('reconoce sabado y domingo', () => {
    expect(esFinDeSemana(fecha('2026-08-15'))).toBe(true); // sabado
    expect(esFinDeSemana(fecha('2026-08-16'))).toBe(true); // domingo
  });

  it('no marca dias de semana', () => {
    expect(esFinDeSemana(fecha('2026-08-17'))).toBe(false); // lunes
  });
});

describe('esFeriado', () => {
  it('reconoce feriado fijo por fecha exacta', () => {
    const feriados: FeriadoLike[] = [{ fecha: fecha('2026-08-25'), es_recurrente: false }];
    expect(esFeriado(fecha('2026-08-25'), feriados)).toBe(true);
    expect(esFeriado(fecha('2026-08-26'), feriados)).toBe(false);
  });

  it('reconoce feriado recurrente por mes y dia, en cualquier anio', () => {
    const feriados: FeriadoLike[] = [{ fecha: fecha('2020-01-01'), es_recurrente: true }];
    expect(esFeriado(fecha('2026-01-01'), feriados)).toBe(true);
    expect(esFeriado(fecha('2026-01-02'), feriados)).toBe(false);
  });
});

describe('esDiaLaboral', () => {
  it('false en fin de semana aunque no haya feriados', () => {
    expect(esDiaLaboral(fecha('2026-08-15'), [])).toBe(false);
  });

  it('false en feriado que cae en dia de semana', () => {
    const feriados: FeriadoLike[] = [{ fecha: fecha('2026-08-25'), es_recurrente: false }];
    expect(esDiaLaboral(fecha('2026-08-25'), feriados)).toBe(false);
  });

  it('true en dia de semana sin feriado', () => {
    expect(esDiaLaboral(fecha('2026-08-17'), [])).toBe(true);
  });
});

describe('proximoDiaHabil', () => {
  it('jueves -> viernes', () => {
    expect(proximoDiaHabil(fecha('2026-08-13'), [])).toEqual(fecha('2026-08-14'));
  });

  it('viernes -> salta el fin de semana y cae lunes', () => {
    expect(proximoDiaHabil(fecha('2026-08-14'), [])).toEqual(fecha('2026-08-17'));
  });

  it('viernes con feriado el lunes -> cae martes', () => {
    const feriados: FeriadoLike[] = [{ fecha: fecha('2026-08-17'), es_recurrente: false }];
    expect(proximoDiaHabil(fecha('2026-08-14'), feriados)).toEqual(fecha('2026-08-18'));
  });
});

describe('diaHabilAnterior', () => {
  it('martes -> lunes', () => {
    expect(diaHabilAnterior(fecha('2026-08-18'), [])).toEqual(fecha('2026-08-17'));
  });

  it('lunes -> salta el fin de semana y cae viernes', () => {
    expect(diaHabilAnterior(fecha('2026-08-17'), [])).toEqual(fecha('2026-08-14'));
  });

  it('lunes con feriado el viernes -> cae jueves', () => {
    const feriados: FeriadoLike[] = [{ fecha: fecha('2026-08-14'), es_recurrente: false }];
    expect(diaHabilAnterior(fecha('2026-08-17'), feriados)).toEqual(fecha('2026-08-13'));
  });
});

describe('seCumplioHorarioMontevideo', () => {
  it('false antes de las 8:00 (Montevideo) del dia objetivo', () => {
    const ahora = new Date('2026-08-13T10:59:00.000Z'); // 07:59 en Montevideo (UTC-3)
    expect(seCumplioHorarioMontevideo(fecha('2026-08-13'), 8, ahora)).toBe(false);
  });

  it('true justo a las 8:00 (Montevideo) del dia objetivo', () => {
    const ahora = new Date('2026-08-13T11:00:00.000Z'); // 08:00 en Montevideo
    expect(seCumplioHorarioMontevideo(fecha('2026-08-13'), 8, ahora)).toBe(true);
  });

  it('false si en Montevideo todavia es el dia anterior, aunque en UTC ya sea el dia objetivo', () => {
    const ahora = new Date('2026-08-13T01:00:00.000Z'); // 2026-08-12 22:00 en Montevideo
    expect(seCumplioHorarioMontevideo(fecha('2026-08-13'), 8, ahora)).toBe(false);
  });

  it('true si ya paso el dia objetivo, sin importar la hora', () => {
    const ahora = new Date('2026-08-15T04:00:00.000Z'); // 2026-08-15 01:00 en Montevideo
    expect(seCumplioHorarioMontevideo(fecha('2026-08-13'), 8, ahora)).toBe(true);
  });
});
