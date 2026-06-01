import { PartialType } from '@nestjs/mapped-types';
import { CrearTipoLicenciaDto } from './crear-tipo-licencia.dto';

export class ActualizarTipoLicenciaDto extends PartialType(CrearTipoLicenciaDto) {}