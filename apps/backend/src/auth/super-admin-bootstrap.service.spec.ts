import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { SuperAdminBootstrapService } from './super-admin-bootstrap.service';

// The service imports the module-level better-auth instance; mock it so the
// spec controls the sign-up call without env/DB requirements.
jest.mock('@/lib/auth', () => ({
  auth: { api: { signUpEmail: jest.fn() } },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { auth } = require('@/lib/auth') as {
  auth: { api: { signUpEmail: jest.Mock } };
};

describe('SuperAdminBootstrapService', () => {
  let service: SuperAdminBootstrapService;
  let em: { transaction: jest.Mock; query: jest.Mock };
  let tx: {
    createQueryBuilder: jest.Mock;
    findOneBy: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let qb: { addSelect: jest.Mock; where: jest.Mock; getOne: jest.Mock };

  const OLD_ENV = process.env;

  beforeEach(async () => {
    process.env = {
      ...OLD_ENV,
      SUPERADMIN_EMAIL: 'root@example.com',
      SUPERADMIN_PASSWORD: 'super-secret-pass',
    };

    qb = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    tx = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOneBy: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      create: jest.fn((_: unknown, data: Record<string, unknown>) => data),
      save: jest.fn((entity: Record<string, unknown>) =>
        Promise.resolve({ id: 'user-1', ...entity }),
      ),
    };
    em = {
      transaction: jest.fn((cb: (m: typeof tx) => unknown) => cb(tx)),
      query: jest.fn().mockResolvedValue([]),
    };
    auth.api.signUpEmail.mockReset().mockResolvedValue({ token: null });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminBootstrapService,
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get(SuperAdminBootstrapService);
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('skips the seed entirely without SUPERADMIN_EMAIL/PASSWORD', async () => {
    delete process.env.SUPERADMIN_EMAIL;

    await service.onApplicationBootstrap();

    expect(em.transaction).not.toHaveBeenCalled();
    expect(auth.api.signUpEmail).not.toHaveBeenCalled();
  });

  it('creates the better-auth credential account on a fresh database', async () => {
    // No better-auth `user` row for the email yet.
    em.query.mockResolvedValue([]);

    await service.onApplicationBootstrap();

    expect(auth.api.signUpEmail).toHaveBeenCalledWith({
      body: {
        name: 'Super Admin',
        email: 'root@example.com',
        password: 'super-secret-pass',
      },
    });
  });

  it('does NOT touch better-auth when the user already exists (no password reset)', async () => {
    em.query.mockImplementation((sql: string) =>
      Promise.resolve(sql.includes('SELECT id') ? [{ id: 'ba-1' }] : []),
    );

    await service.onApplicationBootstrap();

    expect(auth.api.signUpEmail).not.toHaveBeenCalled();
  });

  it('survives a failing sign-up (bootstrap must not crash the app)', async () => {
    em.query.mockResolvedValue([]);
    auth.api.signUpEmail.mockRejectedValue(new Error('table missing'));

    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
  });

  it('mirrors role=admin + emailVerified into the better-auth user table', async () => {
    em.query.mockResolvedValue([]);

    await service.onApplicationBootstrap();

    const calls = em.query.mock.calls as Array<[string, string[]]>;
    const updateCall = calls.find(([sql]) =>
      sql.includes(`SET role = 'admin'`),
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![1]).toEqual(['root@example.com']);
  });
});
