import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';

import { EncryptionService } from './encryption.service';

// Deterministic 32-byte (64 hex char) key for the tests.
const VALID_KEY = 'a'.repeat(64);

function makeService(key: string | undefined): EncryptionService {
  const config = {
    get: jest.fn().mockReturnValue(key),
  } as unknown as ConfigService;
  return new EncryptionService(config);
}

describe('EncryptionService', () => {
  describe('key validation', () => {
    it('throws when the key is missing', () => {
      expect(() => makeService(undefined)).toThrow(
        InternalServerErrorException,
      );
    });

    it('throws when the key is not 64 hex chars (32 bytes)', () => {
      expect(() => makeService('tooshort')).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('encrypt/decrypt roundtrip', () => {
    let service: EncryptionService;

    beforeEach(() => {
      service = makeService(VALID_KEY);
    });

    it('decrypts back to the original plaintext', () => {
      const plaintext = 'smtp-password-123!äö';
      const enc = service.encrypt(plaintext);
      expect(service.decrypt(enc.encryptedValue, enc.iv, enc.authTag)).toBe(
        plaintext,
      );
    });

    it('does not store the plaintext in the ciphertext', () => {
      const plaintext = 'super-secret';
      const enc = service.encrypt(plaintext);
      expect(enc.encryptedValue).not.toContain(plaintext);
    });

    it('uses a fresh random IV per call (same input → different ciphertext)', () => {
      const a = service.encrypt('same-input');
      const b = service.encrypt('same-input');
      expect(a.iv).not.toEqual(b.iv);
      expect(a.encryptedValue).not.toEqual(b.encryptedValue);
      // ...yet both still decrypt correctly.
      expect(service.decrypt(a.encryptedValue, a.iv, a.authTag)).toBe(
        'same-input',
      );
      expect(service.decrypt(b.encryptedValue, b.iv, b.authTag)).toBe(
        'same-input',
      );
    });

    it('handles empty strings', () => {
      const enc = service.encrypt('');
      expect(service.decrypt(enc.encryptedValue, enc.iv, enc.authTag)).toBe('');
    });
  });

  describe('authentication (GCM integrity)', () => {
    let service: EncryptionService;

    beforeEach(() => {
      service = makeService(VALID_KEY);
    });

    it('rejects a tampered authTag', () => {
      const enc = service.encrypt('secret');
      const forgedTag = Buffer.from('0'.repeat(16)).toString('base64');
      expect(() =>
        service.decrypt(enc.encryptedValue, enc.iv, forgedTag),
      ).toThrow();
    });

    it('rejects tampered ciphertext', () => {
      const enc = service.encrypt('secret');
      const tampered = Buffer.from('deadbeefdeadbeef').toString('base64');
      expect(() => service.decrypt(tampered, enc.iv, enc.authTag)).toThrow();
    });

    it('rejects decryption under a different key', () => {
      const enc = service.encrypt('secret');
      const other = makeService('b'.repeat(64));
      expect(() =>
        other.decrypt(enc.encryptedValue, enc.iv, enc.authTag),
      ).toThrow();
    });
  });
});
