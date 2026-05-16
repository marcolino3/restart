/**
 * Strukturierte JSON-Logs in prod/staging, hübsche farbige Logs in dev.
 * Genutzt vom LoggerModule (nestjs-pino) in app.module.ts.
 */
import type { Params } from 'nestjs-pino';
import type { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';

const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging';

export const loggerConfig: Params = {
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),

    // Lokal: pino-pretty für lesbare Logs. In Cluster-Umgebung: rohes JSON
    // für Loki/Grafana.
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname,req,res,responseTime',
            messageFormat: '{msg} {req.method} {req.url} {res.statusCode} ({responseTime}ms)',
          },
        }
      : undefined,

    // Per-Request Correlation-ID: erlaubt es, alle Logs eines Requests
    // im Aggregator (Loki) zusammenzuziehen.
    genReqId: (req: IncomingMessage) => {
      const existing = req.headers['x-request-id'];
      if (typeof existing === 'string' && existing.length > 0) return existing;
      return randomUUID();
    },

    // Sensible Felder redacten — gilt für strukturierte Log-Properties.
    // Tokens, Passwörter, Cookies dürfen nie in Logs landen.
    redact: {
      paths: [
        'req.headers.cookie',
        'req.headers.authorization',
        'req.headers["x-api-key"]',
        'req.body.password',
        'req.body.passwordHash',
        'req.body.token',
        'req.body.magicLinkToken',
        'req.body.refreshToken',
        '*.password',
        '*.passwordHash',
        '*.token',
        '*.magicLinkToken',
        '*.refreshToken',
        '*.cookie',
      ],
      censor: '[REDACTED]',
    },

    // Pro Log-Eintrag: Methode + Pfad + Status + Dauer; Body wird NICHT geloggt.
    serializers: {
      req: (req: { id: string; method: string; url: string; headers: Record<string, unknown> }) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
      }),
      res: (res: { statusCode: number }) => ({
        statusCode: res.statusCode,
      }),
    },

    // Auth-Health-Polls als Trace-Level, damit sie das Log nicht fluten.
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },

    autoLogging: {
      ignore: (req: IncomingMessage) => {
        const url = req.url ?? '';
        return url.startsWith('/api/health');
      },
    },
  },
};
