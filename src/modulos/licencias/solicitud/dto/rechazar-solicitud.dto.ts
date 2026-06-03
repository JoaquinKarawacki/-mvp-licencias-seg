import { IsString, MinLength } from 'class-validator';

export class RechazarSolicitudDto {
  @IsString({ message: 'El motivo debe ser un texto' })
  @MinLength(3, { message: 'El motivo debe tener al menos 3 caracteres' })
  motivo_rechazo!: string;
}