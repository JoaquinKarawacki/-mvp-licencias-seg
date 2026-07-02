import { Module } from '@nestjs/common';
import { TipoLicenciaServicio } from './tipos-licencia.servicio';
import { TipoLicenciaControlador } from './tipos-licencia.controlador';
import { AuditoriaModulo } from '../../auditoria/auditoria.modulo';

@Module({
    imports: [AuditoriaModulo],
    controllers: [TipoLicenciaControlador],
    providers: [TipoLicenciaServicio],
})
export class TipoLicenciaModulo {}
