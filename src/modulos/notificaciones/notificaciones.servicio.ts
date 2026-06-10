import { Injectable, Logger } from '@nestjs/common';
import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { PrismaServicio } from '../../prisma/prisma.servicio';
import { Cron } from '@nestjs/schedule';
import 'isomorphic-fetch';

@Injectable()
export class NotificacionesServicio {
  private readonly logger = new Logger(NotificacionesServicio.name);
  private readonly graphClient: Client;
  private readonly remitente: string;
  private readonly ccFijo: string[];

  constructor(private readonly prisma: PrismaServicio) {
    // 1. Credencial con los datos de la app de Azure
    const credencial = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      process.env.AZURE_CLIENT_SECRET!,
    );

    // 2. Proveedor de autenticación para Graph
    const authProvider = new TokenCredentialAuthenticationProvider(credencial, {
      scopes: ['https://graph.microsoft.com/.default'],
    });

    // 3. Cliente de Graph ya autenticado
    this.graphClient = Client.initWithMiddleware({ authProvider });
    this.remitente = process.env.MAIL_FROM!;
    this.ccFijo = [process.env.MAIL_CC_1!, process.env.MAIL_CC_2!];
  }

  private async calcularProximoDiaHabil(): Promise<Date> {
  const feriados = await this.prisma.feriado.findMany();

  const candidato = new Date();
  candidato.setUTCHours(0, 0, 0, 0);
  candidato.setUTCDate(candidato.getUTCDate() + 1); // empezar desde mañana

  while (true) {
    const diaSemana = candidato.getUTCDay(); // 0=domingo, 6=sábado

    if (diaSemana === 0 || diaSemana === 6) {
      candidato.setUTCDate(candidato.getUTCDate() + 1);
      continue;
    }

    const esFeriado = feriados.some((f) => {
      if (f.es_recurrente) {
        // feriado recurrente: solo importa mes y día, no el año
        return (
          f.fecha.getUTCMonth() === candidato.getUTCMonth() &&
          f.fecha.getUTCDate() === candidato.getUTCDate()
        );
      }
      // feriado fijo: fecha exacta
      return (
        f.fecha.toISOString().split('T')[0] ===
        candidato.toISOString().split('T')[0]
      );
    });

    if (esFeriado) {
      candidato.setUTCDate(candidato.getUTCDate() + 1);
      continue;
    }

    return candidato;
    }
  }

  async notificarVispera(): Promise<void> {
  const proximoDiaHabil = await this.calcularProximoDiaHabil();

  // rango del día para comparar con el DateTime de Postgres
  const inicioDia = new Date(proximoDiaHabil);
  inicioDia.setUTCHours(0, 0, 0, 0);
  const finDia = new Date(proximoDiaHabil);
  finDia.setUTCHours(23, 59, 59, 999);

  // solicitudes aprobadas que tienen algún día en ese rango
  const solicitudes = await this.prisma.solicitudLicencia.findMany({
    where: {
      estado: 'APROBADA',
      dias: {
        some: { fecha: { gte: inicioDia, lte: finDia } },
      },
    },
    include: {
      empleado: true,
      dias: { orderBy: { fecha: 'asc' } },
    },
  });

  // filtrar solo las que EMPIEZAN ese día (no las que solo pasan por ese día)
  const solicitudesQueEmpiezan = solicitudes.filter((s) => {
    if (s.dias.length === 0) return false;
    const primerDia = s.dias[0].fecha;
    return primerDia >= inicioDia && primerDia <= finDia;
  });

  for (const solicitud of solicitudesQueEmpiezan) {
    const nombre = `${solicitud.empleado.nombre} ${solicitud.empleado.apellido}`;
    const diasStr = solicitud.dias
      .map((d) => {
        const [anio, mes, dia] = d.fecha.toISOString().split('T')[0].split('-');
        return `${dia}/${mes}/${anio}`;
      })
      .join(', ');

    await this.enviarCorreo(
      process.env.MAIL_TODOS!,
      `Aviso de licencia mañana - ${nombre}`,
      `<p>Se informa que <strong>${nombre}</strong> comenzará su licencia mañana.</p>
       <p>Días: ${diasStr}</p>`,
      'AVISO_VISPERA',
      );
    }
  }

@Cron('0 8 * * 1-5', { timeZone: 'America/Montevideo' })
async ejecutarAvisoVispera(): Promise<void> {
  this.logger.log('Ejecutando aviso de víspera...');
  try {
    await this.notificarVispera();
  } catch (error) {
    this.logger.error('Error en aviso de víspera', error);
  }
}

  private async enviarCorreo(
  destinatario: string,
  asunto: string,
  cuerpoHtml: string,
  tipo: string,
  cc: string[] = [],
): Promise<void> {
  const mensaje = {
    message: {
      subject: asunto,
      body: { contentType: 'HTML', content: cuerpoHtml },
      toRecipients: [{ emailAddress: { address: destinatario } }],
      ccRecipients: cc.map((email) => ({ emailAddress: { address: email } })),
    },
    saveToSentItems: true,
  };

  try {
    await this.graphClient.api(`/users/${this.remitente}/sendMail`).post(mensaje);
    this.logger.log(`Correo enviado a ${destinatario}: ${asunto}`);

    // registrar éxito
    await this.prisma.notificacion.create({
      data: { destinatario, asunto, tipo, enviado: true },
    });
  } catch (error) {
    this.logger.error(`Error enviando correo a ${destinatario}`, error);

    // registrar fallo
    await this.prisma.notificacion.create({
      data: {
        destinatario,
        asunto,
        tipo,
        enviado: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
    });
  }
}

  async notificarNuevaSolicitud(
  emailEncargado: string,
  nombreEmpleado: string,
  diasDescontados: number,
): Promise<void> {

  const asunto = `Nueva solicitud de licencia - ${nombreEmpleado}`;
  const cuerpo = `
    <p>Hola,</p>
    <p><strong>${nombreEmpleado}</strong> solicitó una licencia de ${diasDescontados} día(s).</p>
    <p>Ingresá al sistema para revisar y dar el OK.</p>
  `;

  await this.enviarCorreo(emailEncargado, asunto, cuerpo, 'NUEVA_SOLICITUD', this.ccFijo);
}

async notificarAprobacion(
  emailEmpleado: string,
  nombreEmpleado: string,
  fechaDesde: string,
  fechaHasta: string,
): Promise<void> {
  // 1. Avisar al empleado
  const asuntoEmpleado = 'Tu solicitud de licencia fue aprobada';
  const cuerpoEmpleado = `
    <p>Hola ${nombreEmpleado},</p>
    <p>Tu solicitud de licencia fue <strong>aprobada</strong>.</p>
    <p>Período: del ${fechaDesde} al ${fechaHasta}.</p>
  `;
  await this.enviarCorreo(emailEmpleado, asuntoEmpleado, cuerpoEmpleado, 'APROBACION', this.ccFijo);

  // 2. Avisar a todos
  const asuntoTodos = `Licencia aprobada - ${nombreEmpleado}`;
  const cuerpoTodos = `
    <p>Se informa que <strong>${nombreEmpleado}</strong> estará de licencia
    del ${fechaDesde} al ${fechaHasta}.</p>
  `;
  await this.enviarCorreo(process.env.MAIL_TODOS!, asuntoTodos, cuerpoTodos, 'APROBACION_GENERAL');
}

async notificarRechazo(
  emailEmpleado: string,
  nombreEmpleado: string,
  motivo: string,
): Promise<void> {
  const asunto = 'Tu solicitud de licencia fue rechazada';
  const cuerpo = `
    <p>Hola ${nombreEmpleado},</p>
    <p>Tu solicitud de licencia fue <strong>rechazada</strong>.</p>
    <p>Motivo: ${motivo}</p>
  `;
  await this.enviarCorreo(emailEmpleado, asunto, cuerpo, 'RECHAZO', this.ccFijo);
  }
}