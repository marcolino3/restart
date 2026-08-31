import { stagingRefusalReason, STAGING_HOST_MARKER } from './reset-staging';

/**
 * These guards are the only thing preventing a misapplied job from wiping a
 * non-staging database, so every way in must be covered — not just the happy
 * path.
 */
describe('stagingRefusalReason', () => {
  const validEnv: NodeJS.ProcessEnv = {
    NODE_ENV: 'staging',
    DB_HOST: 'postgres-postgresql.restart-staging.svc.cluster.local',
    SEED_USER_PASSWORD: 'a-real-password',
  };

  it('allows a fully configured staging environment', () => {
    expect(stagingRefusalReason(validEnv)).toBeNull();
  });

  describe('NODE_ENV', () => {
    it.each([
      ['production', 'production'],
      ['development', 'development'],
      ['test', 'test'],
      // A prefix must not pass — only an exact match.
      ['staging-like', 'staging-like'],
      ['capitalised', 'Staging'],
    ])('refuses %s', (_label, nodeEnv) => {
      const reason = stagingRefusalReason({ ...validEnv, NODE_ENV: nodeEnv });
      expect(reason).toContain('NODE_ENV');
    });

    it('refuses an unset NODE_ENV', () => {
      const { NODE_ENV: _omitted, ...env } = validEnv;
      expect(stagingRefusalReason(env)).toContain('(unset)');
    });
  });

  describe('DB_HOST', () => {
    it('refuses the production database host', () => {
      // Production points at a bare floating IP — no marker anywhere in it.
      const reason = stagingRefusalReason({
        ...validEnv,
        DB_HOST: '172.21.2.249',
      });
      expect(reason).toContain('DB_HOST');
    });

    it('refuses a host from another namespace', () => {
      const reason = stagingRefusalReason({
        ...validEnv,
        DB_HOST: 'postgres-postgresql.restart-production.svc.cluster.local',
      });
      expect(reason).toContain(STAGING_HOST_MARKER);
    });

    it('refuses an unset DB_HOST', () => {
      const { DB_HOST: _omitted, ...env } = validEnv;
      expect(stagingRefusalReason(env)).toContain('(unset)');
    });
  });

  describe('SEED_USER_PASSWORD', () => {
    it('refuses when it is missing', () => {
      const { SEED_USER_PASSWORD: _omitted, ...env } = validEnv;
      expect(stagingRefusalReason(env)).toContain('SEED_USER_PASSWORD');
    });

    it('refuses an empty password', () => {
      const reason = stagingRefusalReason({
        ...validEnv,
        SEED_USER_PASSWORD: '',
      });
      expect(reason).toContain('SEED_USER_PASSWORD');
    });
  });

  it('reports the environment check before the password check', () => {
    // A production environment must be rejected for being production, even if
    // someone also forgot the password — the message has to name the real
    // danger.
    const reason = stagingRefusalReason({
      NODE_ENV: 'production',
      DB_HOST: '172.21.2.249',
    });
    expect(reason).toContain('NODE_ENV');
  });
});
