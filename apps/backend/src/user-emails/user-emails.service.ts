import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ILike, MoreThan, Repository } from 'typeorm';
import { UserEmail } from './entities/user-email.entity';

@Injectable()
export class UserEmailsService {
  constructor(
    @InjectRepository(UserEmail)
    private readonly repo: Repository<UserEmail>,
    @InjectEntityManager() private readonly em: EntityManager,
  ) {}

  async findByEmail(email: string): Promise<UserEmail> {
    const norm = email.trim().toLowerCase();
    const ue = await this.repo.findOne({ where: { email: ILike(norm) } });
    if (!ue) throw new NotFoundException('Email not found');
    return ue;
  }

  async findByEmailWithPassword(email: string): Promise<UserEmail> {
    const norm = email.trim().toLowerCase();
    const ue = await this.repo
      .createQueryBuilder('ue')
      .addSelect('ue.passwordHash')
      .where('LOWER(ue.email) = :email', { email: norm })
      .getOne();
    if (!ue) throw new NotFoundException('Email not found');
    return ue;
  }

  async findByUserId(userId: string): Promise<UserEmail[]> {
    return this.repo.find({ where: { userId } });
  }

  async findOne(id: string): Promise<UserEmail> {
    const ue = await this.repo.findOneBy({ id });
    if (!ue) throw new NotFoundException('UserEmail not found');
    return ue;
  }

  async create(
    userId: string,
    email: string,
    passwordHash?: string,
    isPrimary = false,
    isVerified = false,
  ): Promise<UserEmail> {
    const norm = email.trim().toLowerCase();

    const exists = await this.repo.findOne({ where: { email: ILike(norm) } });
    if (exists) {
      throw new ConflictException('Email already in use');
    }

    const ue = this.repo.create({
      userId,
      email: norm,
      passwordHash: passwordHash ?? null,
      isPrimary,
      isVerified,
    });
    return this.repo.save(ue);
  }

  async setPasswordHash(userEmailId: string, hash: string): Promise<void> {
    await this.repo.update({ id: userEmailId }, { passwordHash: hash });
  }

  async setMagicLinkToken(
    userEmailId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.repo.update(
      { id: userEmailId },
      { magicLinkToken: tokenHash, magicLinkExpiresAt: expiresAt },
    );
  }

  async clearMagicLinkToken(userEmailId: string): Promise<void> {
    await this.repo.update(
      { id: userEmailId },
      { magicLinkToken: null, magicLinkExpiresAt: null },
    );
  }

  async findByMagicLinkToken(tokenHash: string): Promise<UserEmail> {
    const ue = await this.repo
      .createQueryBuilder('ue')
      .addSelect('ue.magicLinkToken')
      .addSelect('ue.magicLinkExpiresAt')
      .where('ue.magicLinkToken = :tokenHash', { tokenHash })
      .andWhere('ue.magicLinkExpiresAt > :now', { now: new Date() })
      .getOne();
    if (!ue) throw new NotFoundException('Invalid or expired magic link');
    return ue;
  }

  async setPrimary(id: string): Promise<UserEmail> {
    const target = await this.findOne(id);
    if (target.isPrimary) return target;
    // TODO: once email verification flow is in place, require isVerified === true here.
    await this.em.transaction(async (trx) => {
      await trx.update(
        UserEmail,
        { userId: target.userId, isPrimary: true },
        { isPrimary: false },
      );
      await trx.update(UserEmail, { id: target.id }, { isPrimary: true });
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<UserEmail> {
    const ue = await this.findOne(id);
    if (ue.isPrimary) {
      throw new BadRequestException('Cannot remove the primary email');
    }
    await this.repo.update({ id }, { isActive: false });
    return { ...ue, isActive: false };
  }
}
