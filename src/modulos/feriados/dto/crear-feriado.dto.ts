import { IsString, MinLength, MaxLength, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CrearFeriadoDto{
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
  nombre!: string;

  @IsDateString({}, { message: 'La fecha debe tener formato válido (YYYY-MM-DD)' })
  fecha!: string;

  @IsOptional()
  @IsBoolean({ message: 'es_recurrente debe ser verdadero o falso' })
  es_recurrente?: boolean
}