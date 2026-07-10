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

  // --- Regla nueva: tramo de 3+ días hábiles consecutivos que cruza dos semanas ---

  it('EJEMPLO DEL USUARIO: jueves, viernes y lunes (cruzan 2 semanas) -> suma el sábado -> 4', () => {
    const fechas = ['2026-05-07', '2026-05-08', '2026-05-11']; // jue, vie, lun (semana siguiente)
    const resultado = servicio.calcularDias(fechas, []);
    expect(resultado).toBe(4);
  });

  it('EJEMPLO DEL USUARIO: lunes, viernes, lunes (NO son consecutivos) -> no suma nada -> 3', () => {
    const fechas = ['2026-05-04', '2026-05-08', '2026-05-11']; // lun, vie (misma semana), lun (semana siguiente)
    const resultado = servicio.calcularDias(fechas, []);
    expect(resultado).toBe(3);
  });

  it('viernes + lunes (solo 2 días, aunque crucen semana) no alcanza el minimo de 3 -> 2', () => {
    const fechas = ['2026-05-08', '2026-05-11']; // vie, lun
    const resultado = servicio.calcularDias(fechas, []);
    expect(resultado).toBe(2);
  });

  it('un feriado en el medio corta el tramo: jueves, viernes(feriado), lunes -> no suma nada -> 2', () => {
    const fechas = ['2026-05-07', '2026-05-08', '2026-05-11']; // jue, vie, lun
    const feriados = [new Date('2026-05-08')]; // viernes es feriado
    // quedan jue y lun sueltos (no consecutivos entre si) -> sin extra
    const resultado = servicio.calcularDias(fechas, feriados);
    expect(resultado).toBe(2);
  });

  it('las dos reglas se acumulan: semana1 con 3 dias (mie,jue,vie) + semana2 con 2 (lun,mar), todo un solo tramo que cruza semanas -> 5 reales + 1 (semana1 tiene 3+) + 1 (tramo cruza semanas) = 7', () => {
    const fechas = [
      '2026-05-06', '2026-05-07', '2026-05-08', // mié, jue, vie (semana 1: 3 días -> regla vieja suma 1)
      '2026-05-11', '2026-05-12',                // lun, mar (semana 2: 2 días -> regla vieja no suma)
    ]; // un solo tramo habil de 5 dias, cruza semana 1 y semana 2 -> regla nueva suma 1 mas
    const resultado = servicio.calcularDias(fechas, []);
    expect(resultado).toBe(7);
  });

  it('orden de entrada desordenado no afecta el resultado (se ordena antes de agrupar)', () => {
    const fechas = ['2026-05-11', '2026-05-07', '2026-05-08']; // lun, jue, vie sin ordenar
    const resultado = servicio.calcularDias(fechas, []);
    expect(resultado).toBe(4);
  });

  it('aplicaReglaSabado=false desactiva tambien la regla nueva', () => {
    const fechas = ['2026-05-07', '2026-05-08', '2026-05-11']; // jue, vie, lun
    const resultado = servicio.calcularDias(fechas, [], false);
    expect(resultado).toBe(3); // 3 días reales, sin ningún extra
  });
});