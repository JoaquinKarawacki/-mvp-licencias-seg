import { CalculadorServicio } from './calculador.servicio';

describe('CalculadorServicio', () => {
  let servicio: CalculadorServicio;

  beforeEach(() => {
    servicio = new CalculadorServicio();
  });

  it('descuenta 2 dias cuando se piden 2 dias (no llega al 50%)', () => {
    const fechas = ['2026-05-04', '2026-05-05']; // lun, mar
    const resultado = servicio.calcularDias(fechas, []);
    expect(resultado).toBe(2);
  });

  it('descuenta 4 dias cuando se piden 3 dias (suma el sabado)', () => {
    const fechas = ['2026-05-04', '2026-05-05', '2026-05-06']; // lun, mar, mié
    const resultado = servicio.calcularDias(fechas, []);
    expect(resultado).toBe(4);
  });

  it('descuenta 6 dias cuando se pide la semana completa', () => {
    const fechas = [
      '2026-05-04',
      '2026-05-05',
      '2026-05-06',
      '2026-05-07',
      '2026-05-08',
    ]; // lun a vie
    const resultado = servicio.calcularDias(fechas, []);
    expect(resultado).toBe(6);
  });

  it('no descuenta un dia que cae en feriado', () => {
    const fechas = ['2026-05-04', '2026-05-05']; // lun, mar
    const feriados = [new Date('2026-05-05')]; // mar es feriado
    const resultado = servicio.calcularDias(fechas, feriados);
    expect(resultado).toBe(1);
  });

  it('evalua cada semana por separado', () => {
    const fechas = [
      '2026-05-04',
      '2026-05-05', // semana 1: 2 días
      '2026-05-11',
      '2026-05-12',
      '2026-05-13', // semana 2: 3 días
    ];
    const resultado = servicio.calcularDias(fechas, []);
    // semana 1: 2 días → 2 | semana 2: 3 días → 4 | total 6
    expect(resultado).toBe(6);
  });

  it('un feriado que baja la semana de 3 a 2 dias quita el sabado', () => {
    const fechas = ['2026-05-04', '2026-05-05', '2026-05-06']; // lun, mar, mié
    const feriados = [new Date('2026-05-06')]; // mié es feriado
    // quedan 2 días reales → no suma sábado → 2
    const resultado = servicio.calcularDias(fechas, feriados);
    expect(resultado).toBe(2);
  });
});