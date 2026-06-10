import { PartialType } from '@nestjs/mapped-types';
import { CrearEmpleadoDto } from './crear-empleado.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class ActualizarEmpleadoDto extends PartialType(CrearEmpleadoDto) {
    @IsBoolean()
    @IsOptional()
    esta_activo?: boolean;
}
