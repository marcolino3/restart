import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { compare, hash } from 'bcrypt';
import { User } from '@/users/entities/user.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';

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
        // 1) UserEmail suchen (case-insensitive)
        let userEmail = await tx
          .createQueryBuilder(UserEmail, 'ue')
          .addSelect('ue.passwordHash')
          .where('LOWER(ue.email) = :email', { email: emailEnv })
          .getOne();

        let user: User | null = null;

        if (userEmail) {
          // UserEmail existiert -> User laden
          user = await tx.findOneBy(User, { id: userEmail.userId });

          // PW-Hash aktualisieren falls noetig
          if (
            !userEmail.passwordHash ||
            !(await compare(passEnv, userEmail.passwordHash))
          ) {
            const newHash = await hash(
              passEnv,
              Number(process.env.BCRYPT_ROUNDS ?? 10),
            );
            await tx.update(UserEmail, { id: userEmail.id }, { passwordHash: newHash });
          }

          // SuperAdmin-Flag sicherstellen
          if (user && !user.isSuperAdmin) {
            await tx.update(User, { id: user.id }, { isSuperAdmin: true });
          }

          this.logger.log(`Superadmin aktualisiert: ${emailEnv}`);
        } else {
          // Neuen User + UserEmail anlegen
          const passwordHash = await hash(
            passEnv,
            Number(process.env.BCRYPT_ROUNDS ?? 10),
          );

          user = tx.create(User, {
            firstName: 'Super',
            lastName: 'Admin',
            isSuperAdmin: true,
            isActive: true,
          });
          const savedUser = await tx.save(user);

          userEmail = tx.create(UserEmail, {
            userId: savedUser.id,
            email: emailEnv,
            passwordHash,
            isPrimary: true,
            isVerified: true,
          });
          await tx.save(userEmail);

          this.logger.log(`Superadmin angelegt: ${emailEnv}`);
        }
      });
    } catch (e) {
      this.logger.error('Superadmin-Seed fehlgeschlagen', e as Error);
      throw e;
    }
  }
}
