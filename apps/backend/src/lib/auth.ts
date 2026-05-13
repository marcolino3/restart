import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const pool = new Pool({
  host: requireEnv('DB_HOST'),
  port: Number(requireEnv('DB_PORT')),
  user: requireEnv('DB_USERNAME'),
  password: requireEnv('DB_PASSWORD'),
  database: requireEnv('DB_NAME'),
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

const trustedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:4000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4001',
  secret: requireEnv('BETTER_AUTH_SECRET'),
  database: pool,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: requireEnv('GOOGLE_AUTH_CLIENT_ID'),
      clientSecret: requireEnv('GOOGLE_AUTH_CLIENT_SECRET'),
    },
  },
});

export type Auth = typeof auth;
