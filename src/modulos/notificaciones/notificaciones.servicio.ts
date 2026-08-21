import { Injectable, Logger } from '@nestjs/common';
import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { PrismaServicio } from '../../prisma/prisma.servicio';
import { Cron } from '@nestjs/schedule';
import 'isomorphic-fetch';
import {
  proximoDiaHabil,
  diaHabilAnterior,
  seCumplioHorarioMontevideo,
} from '../../comun/utilidades/dias-habiles.util';

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
    this.ccFijo = [process.env.MAIL_CC_1, process.env.MAIL_CC_2].filter(
      (email): email is string => !!email,
    );
  }

  private async calcularProximoDiaHabil(): Promise<Date> {
    const feriados = await this.prisma.feriado.findMany();
    return proximoDiaHabil(new Date(), feriados);
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

  // el "próximo día hábil" puede estar varios días de calendario después de
  // hoy (fin de semana o feriado de por medio), asi que no podemos asumir
  // "mañana": hay que nombrar el día real al que corresponde el aviso.
  const diaSemana = new Intl.DateTimeFormat('es-UY', {
    timeZone: 'America/Montevideo',
    weekday: 'long',
  }).format(proximoDiaHabil);
  const [anioObj, mesObj, diaObj] = proximoDiaHabil.toISOString().split('T')[0].split('-');
  const fechaTexto = `${diaObj}/${mesObj}/${anioObj}`;

  for (const solicitud of solicitudesQueEmpiezan) {
    const nombre = `${solicitud.empleado.nombre} ${solicitud.empleado.apellido}`;
    const diasStr = solicitud.dias
      .map((d) => {
        const [anio, mes, dia] = d.fecha.toISOString().split('T')[0].split('-');
        return `${dia}/${mes}/${anio}`;
      })
      .join(', ');

    // una solicitud de 1 solo día no "comienza": ese día entero es la licencia.
    const accion =
      solicitud.dias.length === 1
        ? `estará de licencia el ${diaSemana} ${fechaTexto}`
        : `comenzará su licencia el ${diaSemana} ${fechaTexto}`;

    await this.enviarCorreo(
      process.env.MAIL_TODOS!,
      `Aviso de licencia - ${nombre}`,
      `<p>Se informa que <strong>${nombre}</strong> ${accion}.</p>
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
  diasTexto: string,
): Promise<void> {
  const asuntoEmpleado = 'Tu solicitud de licencia fue aprobada';
  const cuerpoEmpleado = `
    <p>Hola ${nombreEmpleado},</p>
    <p>Tu solicitud de licencia fue <strong>aprobada</strong>.</p>
    <p>Días: ${diasTexto}.</p>
  `;
  await this.enviarCorreo(emailEmpleado, asuntoEmpleado, cuerpoEmpleado, 'APROBACION', this.ccFijo);
}

// El aviso a "todos" normalmente lo manda el cron de vispera
// (ejecutarAvisoVispera), un dia habil antes de que arranque la licencia.
// Este metodo es solo un respaldo: si al momento de aprobar ya se paso el
// horario en que le tocaba correr al cron para esta fecha de inicio (por
// ejemplo, se aprueba la licencia de "manana" a la tarde, o se aprueba en
// fin de semana), el aviso general nunca llegaria por ese camino, asi que
// se manda aca mismo.
async avisarTodosSiCorresponde(
  fechaInicioLicencia: Date,
  nombreEmpleado: string,
  diasTexto: string,
): Promise<void> {
  try {
    const feriados = await this.prisma.feriado.findMany();
    const diaHabilPrevio = diaHabilAnterior(fechaInicioLicencia, feriados);

    if (!seCumplioHorarioMontevideo(diaHabilPrevio, 8)) {
      return; // el cron de manana (o el que corresponda) todavia llega a tiempo
    }

    const asunto = `Aviso de licencia - ${nombreEmpleado}`;
    const cuerpo = `
      <p>Se informa que <strong>${nombreEmpleado}</strong> estará de licencia
      los días ${diasTexto}.</p>
    `;
    await this.enviarCorreo(process.env.MAIL_TODOS!, asunto, cuerpo, 'APROBACION_GENERAL');
  } catch (error) {
    this.logger.error('Error evaluando aviso inmediato de licencia aprobada', error);
  }
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

async notificarCancelacion(
  emailRevisor: string,
  nombreEmpleado: string,
  diasTexto: string,
): Promise<void> {
  const asunto = `Solicitud de licencia cancelada - ${nombreEmpleado}`;
  const cuerpo = `
    <p>Hola,</p>
    <p><strong>${nombreEmpleado}</strong> canceló su solicitud de licencia.</p>
    <p>Días: ${diasTexto}.</p>
  `;
  await this.enviarCorreo(emailRevisor, asunto, cuerpo, 'CANCELACION', this.ccFijo);
}
}