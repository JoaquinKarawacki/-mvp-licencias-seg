import { PartialType } from '@nestjs/mapped-types';
import { CrearFeriadoDto } from './crear-feriado.dto';

export class ActualizarFeriadoDto extends PartialType(CrearFeriadoDto){}