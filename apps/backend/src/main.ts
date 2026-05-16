// Sentry-Instrumentation MUSS vor allem anderen geladen werden — sie hängt
// sich in den Node require-Hook und kann Module nicht mehr instrumentieren,
// die schon geladen sind. `instrument.ts` lädt selbst `dotenv/config`, damit
// better-auth (in src/lib/auth.ts) — das beim Modul-Load läuft — die ENV-Vars
// findet.
import './instrument';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
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
    // bufferLogs verhindert dass Logs während der DI-Initialisierung
    // mit dem Default-Logger (console) rausgehen; sobald wir den
    // nestjs-pino Logger setzen, wird der Buffer geflusht.
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
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

  // Helmet: setzt sicherheitskritische HTTP-Header (X-Content-Type-Options,
  // X-Frame-Options, etc.). Der Ingress setzt diese auch — die App ist
  // Defense-in-Depth für den Fall, dass jemand den Ingress umgeht (z. B.
  // direkter Pod-Zugriff aus einem anderen Service im Cluster).
  //
  // CSP wird hier NICHT gesetzt: das Backend liefert nur API/GraphQL aus,
  // CSP ist eine Frontend-Belange (Next.js Middleware setzt sie pro Response).
  // crossOriginEmbedderPolicy aus: würde Cross-Origin-Bilder/Iframes brechen.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

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
  // eslint-disable-next-line no-console -- Bootstrap-Fehler: Logger noch nicht initialisiert
  console.error('Fatal startup error', err);
  process.exit(1);
});
