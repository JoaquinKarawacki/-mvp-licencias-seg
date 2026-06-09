import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class CambiarContraseniaDto {
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  contrasena_actual!: string;

  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  contrasena_nueva!: string;
}