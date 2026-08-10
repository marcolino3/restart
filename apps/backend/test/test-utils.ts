import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { config } from 'dotenv';

// Load test environment variables
config({ path: join(__dirname, '.env.test') });

/**
 * Creates a NestJS testing module with a real PostgreSQL connection.
 * Requires docker-compose.test.yml to be running (port 5435).
 *
 * Usage:
 *   const { module, dataSource } = await createTestingApp([OrganizationsModule]);
 */
export async function createTestingApp(
  imports: any[] = [],
  options: {
    loadAllEntities?: boolean;
    extraProviders?: any[];
  } = {},
) {
  const module: TestingModule = await Test.createTestingModule({
    providers: options.extraProviders ?? [],
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: join(__dirname, '.env.test'),
      }),
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT!, 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        // Registering a partial forFeature set can leave relation targets
        // unresolved. `loadAllEntities` loads the whole schema via glob so any
        // cross-entity relation resolves, without pulling in feature *modules*
        // (which may transitively import ESM-only deps like better-auth).
        ...(options.loadAllEntities
          ? { entities: [join(__dirname, '../src/**/*.entity.{ts,js}')] }
          : { autoLoadEntities: true }),
        synchronize: true,
        dropSchema: true,
      }),
      ...imports,
    ],
  }).compile();

  const dataSource = module.get(DataSource);

  return { module, dataSource };
}

/**
 * Truncates all tables in the test database (preserving schema).
 * Call between tests for isolation.
 *
 * One statement for every table rather than one statement per table: with
 * `loadAllEntities` a suite carries dozens of entities, and a round trip each
 * pushed `afterEach` past its timeout on a loaded CI runner. TRUNCATE takes a
 * table list, and CASCADE covers the FK dependencies between them.
 */
export async function cleanDatabase(dataSource: DataSource) {
  const tables = dataSource.entityMetadatas.map(
    (entity) => `"${entity.tableName}"`,
  );
  if (tables.length === 0) return;

  await dataSource.query(`TRUNCATE TABLE ${tables.join(', ')} CASCADE`);
}
