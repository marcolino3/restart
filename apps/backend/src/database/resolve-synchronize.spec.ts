import { resolveSynchronize } from './resolve-synchronize';

describe('resolveSynchronize', () => {
  describe('schema-locked environments (production/staging)', () => {
    it.each(['production', 'staging'])(
      'throws when DB_SYNCHRONIZE=true in %s',
      (env) => {
        expect(() => resolveSynchronize(env, 'true')).toThrow(
          /DB_SYNCHRONIZE=true ist in NODE_ENV/,
        );
      },
    );

    it.each(['production', 'staging'])(
      'returns false when DB_SYNCHRONIZE is not true in %s',
      (env) => {
        expect(resolveSynchronize(env, 'false')).toBe(false);
        expect(resolveSynchronize(env, undefined)).toBe(false);
      },
    );
  });

  describe('non-locked environments', () => {
    it('enables synchronize when DB_SYNCHRONIZE=true in development', () => {
      expect(resolveSynchronize('development', 'true')).toBe(true);
    });

    it('enables synchronize when DB_SYNCHRONIZE=true in test', () => {
      expect(resolveSynchronize('test', 'true')).toBe(true);
    });

    it('disables synchronize when DB_SYNCHRONIZE is not true', () => {
      expect(resolveSynchronize('development', 'false')).toBe(false);
      expect(resolveSynchronize('development', undefined)).toBe(false);
    });

    it('treats an undefined NODE_ENV as non-locked (local default)', () => {
      expect(resolveSynchronize(undefined, 'true')).toBe(true);
      expect(resolveSynchronize(undefined, 'false')).toBe(false);
    });

    it('only accepts the exact string "true" (no truthy coercion)', () => {
      expect(resolveSynchronize('development', 'TRUE')).toBe(false);
      expect(resolveSynchronize('development', '1')).toBe(false);
    });
  });
});
