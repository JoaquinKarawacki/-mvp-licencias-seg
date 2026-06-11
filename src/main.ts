import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function iniciar() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  console.log('CORS origin:', frontendUrl);

  app.enableCors({
    origin: frontendUrl,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const puerto = process.env.PORT ?? 3000;
  await app.listen(puerto);

  console.log(`Aplicación corriendo en: http://localhost:${puerto}/api`);
}

iniciar();