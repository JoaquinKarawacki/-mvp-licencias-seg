import { Injectable } from '@nestjs/common';

@Injectable()
export class CalculadorServicio {

    private listarDias(fechaInicio: Date, fechaFin: Date): Date[] {
    const dias: Date[] = [];
    const actual = new Date(fechaInicio);

    while (actual <= fechaFin) {
        dias.push(new Date(actual));
        actual.setDate(actual.getDate() + 1);
    }

        return dias;
    }

    private esFeriado(dia: Date, feriados: Date[]): boolean {
        return feriados.some(
            (feriado) =>
            feriado.toISOString().split('T')[0] === dia.toISOString().split('T')[0],
        );
    }

    private agruparPorSemana(dias: Date[]): Date[][] {
        const semanas: Date[][] = [];
        let semanaActual: Date[] = [];

        for (const dia of dias) {
            if(dia.getUTCDay()==1 && semanaActual.length>0){
                semanas.push(semanaActual);
                semanaActual = [];
            }
            semanaActual.push(dia);

        }
        if(semanaActual.length>0){
            semanas.push(semanaActual);
        }

        return semanas;
    }

    // Lunes (fecha) de la semana a la que pertenece "dia", como string
    // comparable. Sirve para saber si dos dias caen en la misma semana.
    private inicioDeSemana(dia: Date): string {
        const diaSemana = dia.getUTCDay(); // 0=domingo, 1=lunes, ..., 6=sabado
        const retroceso = diaSemana === 0 ? 6 : diaSemana - 1;
        const lunes = new Date(dia);
        lunes.setUTCDate(lunes.getUTCDate() - retroceso);
        return lunes.toISOString().split('T')[0];
    }

    // true si "actual" sigue inmediatamente a "anterior" en dias HABILES:
    // el dia calendario siguiente, o el salto viernes -> lunes (el fin de
    // semana no corta un tramo si no fue pedido).
    private esDiaSiguienteHabil(anterior: Date, actual: Date): boolean {
        const unDiaMs = 24 * 60 * 60 * 1000;
        const diferencia = actual.getTime() - anterior.getTime();

        if (diferencia === unDiaMs) return true;
        if (anterior.getUTCDay() === 5 && diferencia === 3 * unDiaMs) return true; // vie -> lun
        return false;
    }

    // Separa los dias (ya ordenados) en tramos de dias habiles consecutivos.
    // Ej: [jue, vie, lun] -> un solo tramo de 3 (el fin de semana no corta).
    private agruparConsecutivosHabiles(dias: Date[]): Date[][] {
        if (dias.length === 0) return [];

        const tramos: Date[][] = [[dias[0]]];
        for (let i = 1; i < dias.length; i++) {
            if (this.esDiaSiguienteHabil(dias[i - 1], dias[i])) {
                tramos[tramos.length - 1].push(dias[i]);
            } else {
                tramos.push([dias[i]]);
            }
        }
        return tramos;
    }

     calcularDias(fechas: string[], feriados: Date[], aplicaReglaSabado: boolean = true): number {
        const dias = fechas.map((f) => new Date(f));

        const diasValidos = dias
            .filter((dia) => !this.esFeriado(dia, feriados))
            .sort((a, b) => a.getTime() - b.getTime());

        const semanas = this.agruparPorSemana(diasValidos);

        let total = 0;

        for (const semana of semanas) {
            if (semana.length > 2 && aplicaReglaSabado) {
                total += semana.length + 1;
            } else {
                total += semana.length;
            }
        }

        // Regla nueva: un tramo de EXACTAMENTE 3 dias habiles consecutivos
        // (el fin de semana no lo corta) que une dos semanas distintas suma
        // 1 sabado extra, pero SOLO si ese sabado no fue ya sumado por la
        // regla de arriba (semana por semana). El sabado que queda "entre"
        // un viernes y el lunes siguiente pertenece a la semana del viernes:
        // si esa semana ya tuvo mas de 2 dias pedidos, su regla de arriba
        // ya lo conto y no hay que sumarlo de nuevo. Si el tramo tiene MAS
        // (o menos) de 3 dias, esta regla no aplica: cada semana se rige
        // solo por su propia regla de arriba.
        if (aplicaReglaSabado) {
            const diasPorSemana = new Map<string, number>();
            for (const semana of semanas) {
                diasPorSemana.set(this.inicioDeSemana(semana[0]), semana.length);
            }

            const unDiaMs = 24 * 60 * 60 * 1000;
            const tramos = this.agruparConsecutivosHabiles(diasValidos);
            for (const tramo of tramos) {
                if (tramo.length !== 3) continue;

                for (let i = 1; i < tramo.length; i++) {
                    const anterior = tramo[i - 1];
                    const actual = tramo[i];
                    const cruzaFinDeSemana =
                        anterior.getUTCDay() === 5 &&
                        actual.getTime() - anterior.getTime() === 3 * unDiaMs;

                    if (!cruzaFinDeSemana) continue;

                    const diasSemanaAnterior = diasPorSemana.get(this.inicioDeSemana(anterior)) ?? 0;
                    if (diasSemanaAnterior <= 2) {
                        total += 1;
                    }
                }
            }
        }

        return total;
    }
}