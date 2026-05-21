// Jest-only stub for better-auth/api (ESM-only upstream). Tests don't
// exercise the auth flow; they only need the module to load.
export class APIError extends Error {
  status: string;
  body?: unknown;
  constructor(status: string, body?: unknown) {
    const message = extractMessage(body) ?? status;
    super(message);
    this.status = status;
    this.body = body;
    this.name = 'APIError';
  }
}

function extractMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const msg = (body as { message?: unknown }).message;
  if (typeof msg === 'string') return msg;
  if (typeof msg === 'number' || typeof msg === 'boolean') return String(msg);
  return null;
}

export const createAuthMiddleware = (fn: unknown) => fn;

export const getSessionFromCtx = () => Promise.resolve(null);
