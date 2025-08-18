import { Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';

@Injectable()
export class PasswordService {
  async generateRandomPasswordHash(
    length: number = 12,
    includeSymbols: boolean = true,
  ): Promise<string> {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const symbols = '!@#$%^&*()_+{}:"<>?|[];,./';
    const pool = includeSymbols ? chars + symbols : chars;

    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      password += pool[randomIndex];
    }

    const hashedPassword = hash(password, 10);
    return hashedPassword;
  }
}
