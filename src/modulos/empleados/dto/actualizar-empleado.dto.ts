import { PartialType } from '@nestjs/mapped-types';
import { CrearEmpleadoDto } from './crear-empleado.dto';

export class ActualizarEmpleadoDto extends PartialType(CrearEmpleadoDto) {}
