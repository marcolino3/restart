import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface EncryptedData {
  encryptedValue: string;
  iv: string;
  authTag: string;
}

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keyHex = this.configService.get<string>('ORG_SETTINGS_ENCRYPTION_KEY');

    if (!keyHex || keyHex.length !== 64) {
      throw new InternalServerErrorException(
        'ORG_SETTINGS_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)',
      );
    }

    this.key = Buffer.from(keyHex, 'hex');
  }

  encrypt(plaintext: string): EncryptedData {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      encryptedValue: encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  decrypt(encryptedValue: string, iv: string, authTag: string): string {
    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'base64'),
    );

    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    let decrypted = decipher.update(encryptedValue, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
