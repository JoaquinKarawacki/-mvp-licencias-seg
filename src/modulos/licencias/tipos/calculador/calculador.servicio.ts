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
            if(dia.getDay()==1 && semanaActual.length>0){
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

    calcularDias(fechas: string[], feriados: Date[]): number {
        const dias = fechas.map((f) => new Date(f));

        const diasValidos = dias.filter((dia) => !this.esFeriado(dia, feriados));

        const semanas = this.agruparPorSemana(diasValidos);

        let total = 0;

        for (const semana of semanas) {
            if (semana.length > 2) {
            total += semana.length + 1;
            } else {
            total += semana.length;
            }
        }

        return total;
    }
}