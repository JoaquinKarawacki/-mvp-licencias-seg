import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { EmpleadosServicio } from './empleados.servicio';
import { CrearEmpleadoDto } from './dto/crear-empleado.dto';
import { ActualizarEmpleadoDto } from './dto/actualizar-empleado.dto';
import { JwtGuardia } from '../../comun/guardias/jwt.guardia';
import { RolesGuardia } from '../../comun/guardias/roles.guardias';
import { Roles } from '../../comun/decoradores/roles.decorador';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorador';

@Controller('empleados')
@UseGuards(JwtGuardia)
export class EmpleadosControlador {
  constructor(private readonly empleadosServicio: EmpleadosServicio) {}

  @Get('perfil')
  async obtenerPerfil(@UsuarioActual() usuario: { id: number }) {
     return this.empleadosServicio.obtenerPerfil(usuario.id);
   }

  @Get()
  @Roles('ADMIN')
  @UseGuards(RolesGuardia)
  async obtenerTodos() {
    return this.empleadosServicio.obtenerTodos();
  }

  @Get(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuardia)
  async obtenerUno(@Param('id') id: string) {
    return this.empleadosServicio.obtenerUno(+id);
  }
  
  @Post()
  @Roles('ADMIN')
  @UseGuards(RolesGuardia)
  async crear(@Body() empleado: CrearEmpleadoDto) {
    return this.empleadosServicio.crear(empleado);
  }
  
  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuardia)
  async actualizar(@Param('id') id: string, @Body() empleado: ActualizarEmpleadoDto) {
    return this.empleadosServicio.actualizar(+id, empleado);
  } 

}