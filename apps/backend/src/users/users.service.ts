import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, ILike, Repository } from 'typeorm';
import { hash } from 'bcrypt';

import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordService } from './password.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly passwordService: PasswordService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Legt einen neuen User an.
   * - normalisiert E-Mail/Username
   * - prueft Eindeutigkeit der E-Mail (case-insensitive)
   * - hasht das Passwort
   */
  async create(input: CreateUserInput): Promise<User> {
    const emailNorm = input.email.trim().toLowerCase();
    const usernameNorm = input.username?.trim();

    // case-insensitive Check via ILike oder unique index + try/catch
    const exists = await this.entityManager.findOne(User, {
      where: { email: ILike(emailNorm) },
      select: ['id'],
    });
    if (exists) {
      throw new ConflictException('User with this email already exists');
    }

    let passwordHash: string;
    if (!input.password) {
      passwordHash = await this.passwordService.generateRandomPasswordHash(12);
    } else {
      const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);
      passwordHash = await hash(input.password, rounds);
    }

    const user = this.entityManager.create(User, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: emailNorm,
      username: usernameNorm,
      passwordHash,
      // weitere optionale Felder aus deinem DTO hier zuweisen
    });

    const saved = await this.entityManager.save(user);
    // Sicherheits-halber keine sensiblen Felder mutwillig zurueckgeben

    return saved;
  }

  /**
   * Gibt den aktuell eingeloggten User für das UserProfil im Frontend zurück
   * - normalisiert E-Mail/Username
   * - prueft Eindeutigkeit der E-Mail (case-insensitive)
   * - hasht das Passwort
   */
  async findCurrentUser(id: string) {
    return this.userRepository.findOne({
      where: {
        id,
      },
      relations: ['memberships'],
    });
  }

  /**
   * Listet Nutzer (einfach gehalten).
   */
  async findAll(): Promise<User[]> {
    return this.entityManager.find(User);
  }

  /**
   * Holt einen User per ID (404 wenn nicht vorhanden).
   */
  async findOne(id: string): Promise<User> {
    const user = await this.entityManager.findOneBy(User, { id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Holt einen User per E-Mail (case-insensitive) oder wirft 404.
   */
  async findOneByEmail(email: string): Promise<User> {
    const emailNorm = email.trim().toLowerCase();
    const user = await this.entityManager.findOne(User, {
      where: { email: ILike(emailNorm) },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Generisches Update fuer Stammdaten (nicht fuer Passwort/RefreshToken).
   * - normalisiert E-Mail/Username
   * - nutzt direktes Update (kein vorheriges Load + Merge noetig)
   * - gibt den aktuellen Stand zurueck
   */
  async update(input: UpdateUserInput): Promise<User> {
    const { id, email, username, ...rest } = input;

    return this.entityManager.transaction(async (m) => {
      const patch: Partial<User> = { ...rest }; // <-- klar typisiert, kein any

      if (email !== undefined) {
        const emailNorm = email.trim().toLowerCase();

        // Kollision pruefen (falls E-Mail geaendert wird)
        const conflict = await m.findOne(User, {
          where: { email: ILike(emailNorm) },
          select: ['id'],
        });
        if (conflict && conflict.id !== id) {
          throw new ConflictException('Email already in use by another user');
        }

        patch.email = emailNorm; // <-- kein any-Zugriff
      }

      if (username !== undefined) {
        patch.username = username?.trim() ?? null; // falls dein Feld `string | null` ist
      }

      await m.update(User, { id }, patch);

      const updated = await m.findOneBy(User, { id });
      if (!updated) throw new NotFoundException('User not found');
      return updated;
    });
  }

  /**
   * Setzt den gehashten Refresh-Token (Rotation in AuthService).
   */
  async setRefreshToken(
    userId: string,
    refreshTokenHash: string,
  ): Promise<void> {
    await this.entityManager.update(
      User,
      { id: userId },
      { refreshToken: refreshTokenHash },
    );
  }

  /**
   * Loescht/invalidiert den Refresh-Token (z. B. beim Logout).
   */
  async clearRefreshToken(userId: string): Promise<void> {
    await this.entityManager.update(
      User,
      { id: userId },
      { refreshToken: null },
    );
  }

  /**
   * Setzt den Passwort-Hash (Hashing extern erledigen oder hier uebergeben).
   * Wenn du selbst hashen willst, kannst du eine Variante setPasswordPlain implementieren.
   */
  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.entityManager.update(User, { id: userId }, { passwordHash });
  }

  /**
   * Setzt den gehashten Magic-Link-Token und das Ablaufdatum.
   */
  async setMagicLinkToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.entityManager.update(
      User,
      { id: userId },
      { magicLinkToken: tokenHash, magicLinkExpiresAt: expiresAt },
    );
  }

  /**
   * Loescht den Magic-Link-Token (nach erfolgreichem Login oder bei Ablauf).
   */
  async clearMagicLinkToken(userId: string): Promise<void> {
    await this.entityManager.update(
      User,
      { id: userId },
      { magicLinkToken: null, magicLinkExpiresAt: null },
    );
  }

  /**
   * Optional: Soft-Delete oder Deaktivieren (je nach deinem AbstractEntity).
   * Hier als simples Deaktivieren umgesetzt.
   */
  async remove(id: string): Promise<void> {
    const patch: Partial<User> = { isActive: false };
    await this.entityManager.update(User, { id }, patch);
  }
}
