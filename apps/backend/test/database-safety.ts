/** Destructive integration tests require both an isolated target and explicit opt-in. */
export function assertTestDatabase(
  target: { host?: string; database?: unknown },
  env = process.env,
): void {
  if (
    env.NODE_ENV !== 'test' ||
    env.ALLOW_TEST_DATABASE_RESET !== 'true' ||
    !['localhost', '127.0.0.1', '::1'].includes(target.host ?? '') ||
    !['restart_test', 'restart_integration'].includes(String(target.database))
  ) {
    throw new Error(
      'Refusing database reset: use a dedicated local integration database, NODE_ENV=test and ALLOW_TEST_DATABASE_RESET=true',
    );
  }
}
