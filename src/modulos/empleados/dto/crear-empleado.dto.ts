import { 
  IsEmail, 
  IsString, 
  MinLength, 
  IsDateString, 
  IsBoolean, 
  IsInt, 
  IsOptional 
} from 'class-validator';

export class CrearEmpleadoDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email!: string;

  @IsString({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contrasena!: string;

  @IsString({ message: 'El nombre es requerido' })
  nombre!: string;

  @IsString({ message: 'El apellido es requerido' })
  apellido!: string;

  @IsDateString({}, { message: 'La fecha de ingreso debe ser una fecha válida' })
  fecha_ingreso!: string;

  @IsInt({ message: 'El sector debe ser un número válido' })
  sector_id!: number;

  @IsOptional()
  @IsBoolean({ message: 'El campo encargado debe ser verdadero o falso' })
  es_encargado?: boolean;
}