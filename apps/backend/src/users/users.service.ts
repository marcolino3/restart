import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { hash } from 'bcrypt';

import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordService } from './password.service';
import { UserEmailsService } from '@/user-emails/user-emails.service';
import { Membership } from '@/memberships/entities/membership.entity';
import { Role } from '@/roles/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly passwordService: PasswordService,
    private readonly userEmailsService: UserEmailsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Legt einen neuen User an + erstellt die erste UserEmail.
   * Email + optionales PW werden an UserEmailsService delegiert.
   */
  async create(input: CreateUserInput): Promise<User> {
    const usernameNorm = input.username?.trim();

    let passwordHash: string | undefined;
    if (input.password) {
      const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);
      passwordHash = await hash(input.password, rounds);
    } else {
      passwordHash = await this.passwordService.generateRandomPasswordHash(12);
    }

    return this.entityManager.transaction(async (tx) => {
      const user = tx.create(User, {
        title: input.title,
        firstName: input.firstName,
        lastName: input.lastName,
        username: usernameNorm,
        isActive: input.isActive,
      });
      const saved = await tx.save(user);

      // Erste Email als primary + verified anlegen
      const userEmail = await this.userEmailsService.create(
        saved.id,
        input.email,
        passwordHash,
        true, // isPrimary
        true, // isVerified
      );

      // Membership erstellen
      const membership = tx.create(Membership, {
        userId: saved.id,
        organizationId: input.organizationId,
        persona: input.persona,
        userEmailId: userEmail.id,
      });
      const savedMembership = await tx.save(membership);

      // Roles zuweisen
      if (input.roleIds?.length) {
        const roles = await tx.findByIds(Role, input.roleIds);
        savedMembership.roles = roles;
        await tx.save(savedMembership);
      }

      return saved;
    });
  }

  /**
   * Gibt den aktuell eingeloggten User mit Relationen zurueck.
   */
  async findCurrentUser(id: string) {
    return this.userRepository.findOne({
      where: { id },
      relations: ['memberships', 'userEmails'],
    });
  }

  async findAll(): Promise<User[]> {
    return this.entityManager.find(User, {
      relations: [
        'userEmails',
        'userEmails.authAccounts',
        'memberships',
        'memberships.organization',
      ],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.entityManager.findOne(User, {
      where: { id },
      relations: [
        'userEmails',
        'userEmails.authAccounts',
        'memberships',
        'memberships.organization',
      ],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Findet User ueber Email - delegiert an UserEmailsService.
   */
  async findOneByEmail(email: string): Promise<User> {
    const ue = await this.userEmailsService.findByEmail(email);
    return this.findOne(ue.userId);
  }

  /**
   * Generisches Update fuer Stammdaten.
   * Keine Email-Updates hier - laeuft ueber UserEmailsService.
   */
  async update(input: UpdateUserInput): Promise<User> {
    const { id, username, ...rest } = input;

    return this.entityManager.transaction(async (m) => {
      const patch: Partial<User> = { ...rest };

      if (username !== undefined) {
        patch.username = username?.trim() ?? null;
      }

      await m.update(User, { id }, patch);

      const updated = await m.findOne(User, {
        where: { id },
        relations: ['userEmails'],
      });
      if (!updated) throw new NotFoundException('User not found');
      return updated;
    });
  }

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

  async clearRefreshToken(userId: string): Promise<void> {
    await this.entityManager.update(
      User,
      { id: userId },
      { refreshToken: null },
    );
  }

  async remove(id: string): Promise<void> {
    const patch: Partial<User> = { isActive: false };
    await this.entityManager.update(User, { id }, patch);
  }
}
