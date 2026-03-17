import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,POST,PUT,PATCH,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  });

  app.setGlobalPrefix('api');

  // Validation globale des DTOs entrants
  // whitelist: supprime les champs non déclarés dans le DTO
  // forbidNonWhitelisted: retourne une erreur 400 si des champs inconnus sont envoyés
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // convertit automatiquement les types (string → number, etc.)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
