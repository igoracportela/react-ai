import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
  mkdirSync(uploadDir, { recursive: true });
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`AI Scribe API running on http://localhost:${port}/api`);
}

bootstrap();
