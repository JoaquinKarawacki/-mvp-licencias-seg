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

  it('las dos reglas NO se acumulan cuando es el mismo sabado: semana1 con 3 dias (mie,jue,vie) + semana2 con 2 (lun,mar) -> el sabado ya lo sumo la semana1, el tramo no debe sumarlo de nuevo -> 6', () => {
    const fechas = [
      '2026-05-06', '2026-05-07', '2026-05-08', // mié, jue, vie (semana 1: 3 días -> suma 1 por su propio sábado)
      '2026-05-11', '2026-05-12',                // lun, mar (semana 2: 2 días -> no suma)
    ]; // el tramo cruza semana 1 y semana 2, pero el sábado entre vie y lun ya fue
    // sumado por la semana 1 (tuvo 3+ días) -> no se debe sumar dos veces
    const resultado = servicio.calcularDias(fechas, []);
    expect(resultado).toBe(6);
  });

  it('BUG REPORTADO: 6 al 10 (semana completa) + 13 y 14 -> 7 reales + 1 sabado (semana1) = 8, sin duplicar', () => {
    const fechas = [
      '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10', // lun a vie
      '2026-07-13', '2026-07-14', // lun, mar (semana siguiente)
    ];
    const resultado = servicio.calcularDias(fechas, []);
    expect(resultado).toBe(8);
  });

  it('BUG REPORTADO: 6 al 10 + 13, 14 y 15 -> 8 reales + 1 sabado (semana1) + 1 sabado (semana2, 3 dias) = 10, sin duplicar', () => {
    const fechas = [
      '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10', // lun a vie
      '2026-07-13', '2026-07-14', '2026-07-15', // lun, mar, mié (semana siguiente: 3 días -> suma su propio sábado)
    ];
    const resultado = servicio.calcularDias(fechas, []);
    expect(resultado).toBe(10);
  });

  it('BUG REPORTADO: jueves, viernes + semana completa siguiente (tramo de 7, no de 3) -> NO suma el cruce, solo el sabado propio de la semana completa -> 8', () => {
    const fechas = [
      '2026-07-09', '2026-07-10', // jue, vie (semana 1: 2 días, no llega a 3)
      '2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17', // lun a vie (semana 2: 5 días -> suma su propio sábado)
    ];
    // tramo total: jue,vie,lun,mar,mie,jue,vie = 7 dias (no es exactamente 3)
    // -> la regla del cruce de semana NO aplica (antes se sumaba de mas)
    // solo aplica la regla por semana: semana2 (5 dias > 2) suma 1
    // total = 7 dias reales + 1 = 8
    const resultado = servicio.calcularDias(fechas, []);
    expect(resultado).toBe(8);
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