import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModulo } from './prisma/prisma.modulo';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModulo,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}