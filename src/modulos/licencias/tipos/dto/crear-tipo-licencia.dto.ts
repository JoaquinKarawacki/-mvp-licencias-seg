import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CrearTipoLicenciaDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
  nombre!: string;

  @IsString({ message: 'El código debe ser texto' })
  codigo!: string;

  @IsOptional()
  @IsBoolean({ message: 'requiere_saldo debe ser verdadero o falso' })
  requiere_saldo?: boolean;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;
}