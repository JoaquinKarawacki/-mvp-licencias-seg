import { Global, Module } from '@nestjs/common';
import { PrismaServicio } from './prisma.servicio';

@Global()
@Module({
  providers: [PrismaServicio],
  exports: [PrismaServicio],
})
export class PrismaModulo {}