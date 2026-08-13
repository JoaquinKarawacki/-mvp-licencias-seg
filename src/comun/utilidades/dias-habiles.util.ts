// Utilidades puras de dias habiles (sin fines de semana ni feriados).
// Las fechas se tratan como valores "solo fecha" en UTC (medianoche UTC =
// esa fecha calendario), igual que el resto del backend ya lo hace.

export interface FeriadoLike {
  fecha: Date;
  es_recurrente: boolean;
}

export function esFinDeSemana(fecha: Date): boolean {
  const diaSemana = fecha.getUTCDay(); // 0=domingo, 6=sabado
  return diaSemana === 0 || diaSemana === 6;
}

export function esFeriado(fecha: Date, feriados: FeriadoLike[]): boolean {
  return feriados.some((f) => {
    if (f.es_recurrente) {
      // feriado recurrente: solo importa mes y dia, no el anio
      return (
        f.fecha.getUTCMonth() === fecha.getUTCMonth() &&
        f.fecha.getUTCDate() === fecha.getUTCDate()
      );
    }
    // feriado fijo: fecha exacta
    return (
      f.fecha.toISOString().split('T')[0] === fecha.toISOString().split('T')[0]
    );
  });
}

export function esDiaLaboral(fecha: Date, feriados: FeriadoLike[]): boolean {
  return !esFinDeSemana(fecha) && !esFeriado(fecha, feriados);
}

function normalizarFechaUTC(fecha: Date): Date {
  const copia = new Date(fecha);
  copia.setUTCHours(0, 0, 0, 0);
  return copia;
}

// Primer dia habil DESPUES de "desde" (nunca devuelve "desde" mismo).
export function proximoDiaHabil(desde: Date, feriados: FeriadoLike[]): Date {
  const candidato = normalizarFechaUTC(desde);
  candidato.setUTCDate(candidato.getUTCDate() + 1);

  while (!esDiaLaboral(candidato, feriados)) {
    candidato.setUTCDate(candidato.getUTCDate() + 1);
  }

  return candidato;
}

// Primer dia habil ANTES de "desde" (nunca devuelve "desde" mismo).
export function diaHabilAnterior(desde: Date, feriados: FeriadoLike[]): Date {
  const candidato = normalizarFechaUTC(desde);
  candidato.setUTCDate(candidato.getUTCDate() - 1);

  while (!esDiaLaboral(candidato, feriados)) {
    candidato.setUTCDate(candidato.getUTCDate() - 1);
  }

  return candidato;
}

function fechaYHoraEnMontevideo(ahora: Date): { fechaIso: string; hora: number } {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(ahora);

  const obtener = (tipo: string) => partes.find((p) => p.type === tipo)!.value;
  const fechaIso = `${obtener('year')}-${obtener('month')}-${obtener('day')}`;
  const hora = Number(obtener('hour'));

  return { fechaIso, hora };
}

// True si, en este momento, ya se cumplieron las "horaLimite" horas (hora de
// Montevideo) del dia "fechaObjetivo" -- o sea, si ese dia ya paso, o es hoy
// y ya es esa hora o mas tarde. Se usa para saber si el cron de las 8:00 que
// le correspondia a esa fecha ya tuvo su oportunidad de correr.
export function seCumplioHorarioMontevideo(
  fechaObjetivo: Date,
  horaLimite: number,
  ahora: Date = new Date(),
): boolean {
  const objetivoIso = fechaObjetivo.toISOString().split('T')[0];
  const { fechaIso: hoyIso, hora } = fechaYHoraEnMontevideo(ahora);

  if (hoyIso > objetivoIso) return true;
  if (hoyIso < objetivoIso) return false;
  return hora >= horaLimite;
}
