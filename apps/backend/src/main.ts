// Load .env before any other imports — better-auth (in src/lib/auth.ts) is
// constructed at module-load time and needs DB_*, GOOGLE_AUTH_*, and
// BETTER_AUTH_* env vars before NestJS's ConfigModule runs.
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

// Skip body parsing on better-auth routes — the lib reads the raw stream itself.
const skipAuthPath =
  (middleware: express.RequestHandler): express.RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/auth/')) return next();
    return middleware(req, res, next);
  };

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Required by better-auth: it reads the raw request stream.
    // @thallesp/nestjs-better-auth re-applies JSON/urlencoded parsing for
    // non-auth routes via its own middleware (see forRoot bodyParser option).
    bodyParser: false,
  });
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
  // Re-apply body parsing for non-auth routes (the global `bodyParser: false`
  // above disabled Nest's built-in parser so better-auth can read the raw
  // stream on /api/auth/*).
  app.use(skipAuthPath(express.json({ limit: '10mb' })));
  app.use(skipAuthPath(express.urlencoded({ extended: true, limit: '10mb' })));
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
