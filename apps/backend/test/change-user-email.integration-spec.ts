/**
 * Integration tests for UsersService.changeUserEmail.
 *
 * Verifies the email is changed ATOMICALLY across both stores that live in the
 * same DB: TypeORM `user_emails` and the better-auth `"user"` table (login).
 *
 * Requires a running PostgreSQL test database (port 5435, see test/.env.test).
 * Start it e.g. with:
 *   docker run -d --name restart-test-pg -p 5435:5432 \
 *     -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=restart_test \
 *     postgres:16-alpine
 * Run: npx jest --config ./test/jest-e2e.json --testPathPatterns=change-user-email
 */
import { join } from 'path';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';

import { DatabaseModule } from '@/database/database.module';
import { UsersService } from '@/users/users.service';
import { PasswordService } from '@/users/password.service';
import { UserEmailsService } from '@/user-emails/user-emails.service';
import { User } from '@/users/entities/user.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import { cleanDatabase } from './test-utils';

config({ path: join(__dirname, '.env.test') });

describe('UsersService.changeUserEmail (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: UsersService;

  // better-auth "user" table is not a TypeORM entity → create a minimal one.
  const createAuthUserTable = () =>
    dataSource.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id text PRIMARY KEY,
        email text NOT NULL UNIQUE,
        "emailVerified" boolean NOT NULL DEFAULT false,
        name text
      )
    `);

  /** Seeds a User + primary UserEmail + matching better-auth "user" row. */
  async function seedUser(email: string, authId: string) {
    const user = await dataSource
      .getRepository(User)
      .save({ firstName: 'Test', lastName: 'User' } as Partial<User>);
    await dataSource.getRepository(UserEmail).save({
      userId: user.id,
      email,
      isPrimary: true,
      isVerified: true,
    } as Partial<UserEmail>);
    await dataSource.query(
      'INSERT INTO "user" (id, email, "emailVerified", name) VALUES ($1, $2, true, $3)',
      [authId, email, 'Test User'],
    );
    return user;
  }

  const authEmail = async (id: string): Promise<{ email: string; verified: boolean }> => {
    const rows: Array<{ email: string; emailVerified: boolean }> =
      await dataSource.query(
        'SELECT email, "emailVerified" FROM "user" WHERE id = $1',
        [id],
      );
    return { email: rows[0].email, verified: rows[0].emailVerified };
  };

  beforeAll(async () => {
    // Build the module WITHOUT UsersModule/Resolver — the resolver pulls in the
    // better-auth ESM guard which jest (CommonJS) cannot load. UsersService only
    // needs TypeORM repos + PasswordService + UserEmailsService.
    module = await Test.createTestingModule({
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
        DatabaseModule,
      ],
      providers: [UsersService, PasswordService, UserEmailsService],
    }).compile();

    dataSource = module.get(DataSource);
    service = module.get(UsersService);
    await createAuthUserTable();
  }, 30000);

  afterAll(async () => {
    await dataSource?.query('DROP TABLE IF EXISTS "user" CASCADE');
    await dataSource?.destroy();
    await module?.close();
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
    await dataSource.query('TRUNCATE TABLE "user" CASCADE');
  });

  it('changes the email in BOTH user_emails and better-auth "user"', async () => {
    const user = await seedUser('old@example.com', 'auth-1');

    await service.changeUserEmail(user.id, 'New@Example.com');

    const ue = await dataSource
      .getRepository(UserEmail)
      .findOneByOrFail({ userId: user.id });
    expect(ue.email).toBe('new@example.com'); // normalized lowercase
    expect(ue.isVerified).toBe(false); // reset

    const auth = await authEmail('auth-1');
    expect(auth.email).toBe('new@example.com');
    expect(auth.verified).toBe(false); // reset
  });

  it('is a no-op when the email is unchanged', async () => {
    const user = await seedUser('same@example.com', 'auth-2');
    await service.changeUserEmail(user.id, 'same@example.com');
    const ue = await dataSource
      .getRepository(UserEmail)
      .findOneByOrFail({ userId: user.id });
    expect(ue.email).toBe('same@example.com');
    expect(ue.isVerified).toBe(true); // unchanged → not reset
  });

  it('rejects an email already used by another user (user_emails)', async () => {
    const userA = await seedUser('a@example.com', 'auth-a');
    await seedUser('b@example.com', 'auth-b');

    await expect(
      service.changeUserEmail(userA.id, 'b@example.com'),
    ).rejects.toBeInstanceOf(ConflictException);

    // nothing changed on A
    const ue = await dataSource
      .getRepository(UserEmail)
      .findOneByOrFail({ userId: userA.id });
    expect(ue.email).toBe('a@example.com');
    expect((await authEmail('auth-a')).email).toBe('a@example.com');
  });
});
