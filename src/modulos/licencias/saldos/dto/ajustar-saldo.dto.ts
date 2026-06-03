import { IsInt, IsNumber } from 'class-validator';

export class AjustarSaldoDto {
  @IsInt({ message: 'El empleado debe ser un id numérico' })
  empleado_id!: number;

  @IsInt({ message: 'El tipo de licencia debe ser un id numérico' })
  tipo_licencia_id!: number;

  @IsInt({ message: 'El año debe ser numérico' })
  anio!: number;

  @IsNumber({}, { message: 'Los días deben ser un número' })
  dias!: number;
}