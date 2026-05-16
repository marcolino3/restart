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
  synchronize: false,
  logging: ['error', 'warn', 'migration'],
});
