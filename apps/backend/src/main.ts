import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const allowedOrigins = configService
    .get('ALLOWED_ORIGINS', 'http://localhost:4000')
    .split(',')
    .map((origin: string) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('/api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: false,
      skipMissingProperties: true,
    }),
  );

  await app.listen(configService.getOrThrow('PORT') || 3000);
}

bootstrap().catch((err) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
