/**
 * TypeORM DataSource für CLI-Befehle (migration:generate / migration:run / migration:revert)
 * und für den Production-Migration-Runner (src/migrate.ts).
 *
 * Die Laufzeit-Konfiguration für den NestJS-Server lebt in app.module.ts.
 */
import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const isProd = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: isProd ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'typeorm_migrations',
  // 'each' statt Default 'all': Postgres 16 verbietet es, einen per
  // ALTER TYPE ... ADD VALUE ergänzten Enum-Wert in derselben Transaktion zu
  // verwenden (55P04). Mit einer Gesamt-Transaktion über alle Migrationen
  // bricht ein frischer Bootstrap ab (z.B. BackfillProjectPermissions nutzt
  // den zuvor ergänzten Wert PROJECT_READ). migrate.ts setzt 'each' bereits
  // explizit — hier gilt es damit auch für die TypeORM-CLI (migration:run).
  migrationsTransactionMode: 'each',
  synchronize: false,
  logging: ['error', 'warn', 'migration'],
});
