import { assertTestDatabase } from '../../test/database-safety';

describe('destructive test database protection', () => {
  const env = { NODE_ENV: 'test', ALLOW_TEST_DATABASE_RESET: 'true' };
  it.each(['restart_test', 'restart_integration'])(
    'allows explicitly enabled isolated database %s',
    (database) => {
      expect(() =>
        assertTestDatabase({ host: 'localhost', database }, env),
      ).not.toThrow();
    },
  );
  it.each([
    [{ host: 'localhost', database: 'production' }, env],
    [{ host: 'remote.example', database: 'restart_test' }, env],
    [{ host: 'localhost', database: 'colibri_test' }, env],
    [{ host: 'localhost', database: 'restart_test' }, { NODE_ENV: 'test' }],
    [
      { host: 'localhost', database: 'restart_test' },
      { ...env, NODE_ENV: 'production' },
    ],
  ])('rejects unsafe configuration %#', (target, environment) => {
    expect(() => assertTestDatabase(target, environment)).toThrow(
      'Refusing database reset',
    );
  });
});
