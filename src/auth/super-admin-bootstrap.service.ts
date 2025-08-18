// src/auth/superadmin-bootstrap.service.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { compare, hash } from 'bcrypt';
import { User } from '@/users/entities/user.entity';

@Injectable()
export class SuperAdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SuperAdminBootstrapService.name);
  constructor(private readonly em: EntityManager) {}

  async onApplicationBootstrap() {
    const emailEnv = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
    const passEnv = process.env.SUPERADMIN_PASSWORD;

    if (!emailEnv || !passEnv) {
      this.logger.warn(
        'SUPERADMIN_EMAIL/PASSWORD nicht gesetzt – ueberspringe Superadmin-Seed',
      );
      return;
    }

    try {
      await this.em.transaction(async (tx) => {
        // Optional: Passwort nur neu hashen, wenn sich etwas geaendert hat
        const existing = await tx.findOne(User, {
          where: { email: emailEnv },
          select: ['id', 'passwordHash'], // wichtig: Hash explizit laden
        });

        let passwordHash = existing?.passwordHash ?? '';
        if (!existing || !(await compare(passEnv, passwordHash))) {
          passwordHash = await hash(
            passEnv,
            Number(process.env.BCRYPT_ROUNDS ?? 10),
          );
        }

        // Idempotent: upsert by email
        await tx.getRepository(User).upsert(
          {
            email: emailEnv,
            firstName: 'Super',
            lastName: 'Admin',
            passwordHash,
            isSuperAdmin: true,
            isActive: true,
          },
          ['email'],
        );

        this.logger.log(
          existing
            ? `Superadmin aktualisiert: ${emailEnv}`
            : `Superadmin angelegt: ${emailEnv}`,
        );
      });
    } catch (e) {
      this.logger.error('Superadmin-Seed fehlgeschlagen', e as Error);
      throw e;
    }
  }
}
