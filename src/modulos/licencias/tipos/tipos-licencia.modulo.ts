import { Module } from '@nestjs/common';
import { TipoLicenciaServicio } from './tipos-licencia.servicio';
import { TipoLicenciaControlador } from './tipos-licencia.controlador';

@Module({
    controllers:[TipoLicenciaControlador],
    providers: [TipoLicenciaServicio]
})
export class TipoLicenciaModulo {}