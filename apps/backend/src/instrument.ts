/**
 * Sentry-Instrumentation. MUSS als allererstes Modul geladen werden — vor
 * NestFactory, vor App-Code. In main.ts steht daher `import './instrument'`
 * an oberster Stelle (noch vor `dotenv/config`, das hier inline gemacht wird).
 *
 * Sentry hängt sich in Node's require-Hook, um HTTP/Postgres/Express
 * automatisch zu tracen. Wird es zu spät geladen, fehlen Spans und Tracebacks.
 */
import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE,
    integrations: [nodeProfilingIntegration()],

    // Sampling: in prod 10 %, in staging 50 %, lokal 100 %. Über ENV überschreibbar.
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE ??
        (process.env.NODE_ENV === 'production' ? '0.1' : '1.0'),
    ),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0.1'),

    // PII-Schutz — KRITISCH für Schul-SaaS (DSGVO/revDSG).
    // Sentry darf KEINE Request-Header (Cookies, Auth), Bodies oder User-Daten loggen,
    // ausser wir markieren sie explizit. sendDefaultPii bleibt false.
    sendDefaultPii: false,

    beforeSend(event, hint) {
      // Auth-Routen aus Breadcrumbs/Spans ausfiltern (Tokens, Passwörter, Magic-Links).
      if (event.request?.url?.includes('/api/auth/')) {
        if (event.request) {
          delete event.request.data;
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers['cookie'];
            delete event.request.headers['authorization'];
          }
        }
      }
      // Pflicht-Felder, die wir nie an Sentry leaken wollen.
      if (event.request?.headers) {
        delete event.request.headers['cookie'];
        delete event.request.headers['authorization'];
        delete event.request.headers['x-api-key'];
      }
      return event;
    },

    ignoreErrors: [
      // Erwartete Auth-Fehler — nicht als Errors loggen, sondern als Warnings im pino-Log.
      'UnauthorizedException',
      'ForbiddenException',
      'BadRequestException',
    ],
  });
}
