import { Injectable } from '@nestjs/common';
import { PrismaServicio } from '../../prisma/prisma.servicio';

// Datos que recibe el método registrar
interface DatosAuditoria {
  usuario_id?: number | null;
  usuario_email: string;
  accion: string;
  descripcion: string;
  entidad?: string | null;
  entidad_id?: number | null;
}

const PAGINA_POR_DEFECTO = 1;
const LIMITE_POR_DEFECTO = 50;
const LIMITE_MAXIMO = 100;

@Injectable()
export class AuditoriaServicio {
  constructor(private readonly prisma: PrismaServicio) {}

  // Registra una acción. NUNCA rompe el flujo: si falla el guardado,
  // lo logueamos pero no relanzamos (igual que las notificaciones).
  async registrar(datos: DatosAuditoria) {
    try {
      await this.prisma.auditLog.create({
        data: {
          usuario_id: datos.usuario_id ?? null,
          usuario_email: datos.usuario_email,
          accion: datos.accion,
          descripcion: datos.descripcion,
          entidad: datos.entidad ?? null,
          entidad_id: datos.entidad_id ?? null,
        },
      });
    } catch (error) {
      // No relanzamos: la auditoría no debe tumbar la acción principal
      console.error('Error al registrar auditoría:', error);
    }
  }

  // Lista los registros para la pantalla de admin, más nuevos primero y paginados
  // para no traer toda la tabla de una vez.
  async obtenerTodos(pagina?: number, limite?: number) {
    const paginaValida = pagina && pagina > 0 ? pagina : PAGINA_POR_DEFECTO;
    const limiteValido =
      limite && limite > 0
        ? Math.min(limite, LIMITE_MAXIMO)
        : LIMITE_POR_DEFECTO;

    return this.prisma.auditLog.findMany({
      orderBy: [{ fecha_creacion: 'desc' }, { id: 'desc' }],
      skip: (paginaValida - 1) * limiteValido,
      take: limiteValido,
    });
  }
}
