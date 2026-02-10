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
export async function createTestingApp(imports: any[] = []) {
  const module: TestingModule = await Test.createTestingModule({
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
        autoLoadEntities: true,
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
 */
export async function cleanDatabase(dataSource: DataSource) {
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(
      `TRUNCATE TABLE "${entity.tableName}" CASCADE`,
    );
  }
}
