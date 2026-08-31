import { StorageService } from './storage.service';

/**
 * Regression: production ran without any S3_* configuration, so every upload
 * fell back to the local filesystem — which is read-only inside the hardened
 * container (`readOnlyRootFilesystem: true`, only /tmp mounted as an
 * emptyDir). Uploads failed with an opaque 500 instead of the misconfiguration
 * being visible at deploy time.
 */
describe('StorageService configuration', () => {
  const S3_ENV = [
    'S3_BUCKET',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'S3_ENDPOINT',
    'S3_REGION',
  ] as const;

  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(
      [...S3_ENV, 'NODE_ENV'].map((k) => [k, process.env[k]]),
    );
    for (const key of S3_ENV) delete process.env[key];
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('refuses to boot in production without a bucket', () => {
    process.env.NODE_ENV = 'production';

    expect(() => new StorageService()).toThrow(
      /Object storage is not configured/,
    );
  });

  it('boots in production once the bucket credentials are present', () => {
    process.env.NODE_ENV = 'production';
    process.env.S3_BUCKET = 'restart-prod';
    process.env.S3_ACCESS_KEY_ID = 'key';
    process.env.S3_SECRET_ACCESS_KEY = 'secret';

    expect(() => new StorageService()).not.toThrow();
  });

  it('keeps the local filesystem fallback outside production', () => {
    process.env.NODE_ENV = 'development';

    expect(() => new StorageService()).not.toThrow();
  });
});
