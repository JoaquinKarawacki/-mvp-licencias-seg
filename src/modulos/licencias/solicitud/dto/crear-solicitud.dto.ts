import { IsString, IsInt, IsArray, IsOptional, IsDateString } from 'class-validator';

export class CrearSolicitudLicenciaDto {
  @IsInt({ message: 'El id debe ser numerico' })
  tipo_licencia_id!: number;

  @IsArray({ message: 'Los días deben ser una lista' })
  @IsDateString({}, { each: true, message: 'Cada día debe ser una fecha válida' })
  dias!: string[];

  @IsOptional()
  @IsString({ message: 'El comentario debe ser un texto' })
  comentario?: string;
}