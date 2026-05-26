import { PartialType } from '@nestjs/mapped-types';
import { CrearSectorDto } from './crear-sector.dto';

export class ActualizarSectorDto extends PartialType(CrearSectorDto) {}