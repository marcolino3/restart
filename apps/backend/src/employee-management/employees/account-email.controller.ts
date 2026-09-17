import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { IsEmail, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Request } from 'express';
import { EntityManager, Raw } from 'typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { auth } from '@/lib/auth';
import { mailer } from '@/lib/mailer';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import { AccountEmailChange } from './entities/account-email-change.entity';

class RequestAccountEmailChange {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
class ConfirmAccountEmailChange {
  @Matches(/^[a-f0-9]{64}$/) token!: string;
}
const hash = (token: string) =>
  createHash('sha256').update(token).digest('hex');
const exactEmail = (email: string) =>
  Raw((column) => `LOWER(${column}) = :email`, { email });

/** Account-owner-only flow, requiring possession of BOTH old and new mailboxes. */
@Controller('account-email')
export class AccountEmailController {
  constructor(private readonly manager: EntityManager) {}
  private async session(request: Request) {
    const session = await auth.api.getSession({
      headers: request.headers as unknown as Headers,
    });
    if (!session?.user)
      throw new UnauthorizedException('Sign in to change your own email');
    return session.user;
  }
  @Post('request')
  async request(
    @Body() input: RequestAccountEmailChange,
    @Req() request: Request,
  ) {
    const user = await this.session(request);
    const oldEmail = user.email.toLowerCase().trim();
    if (oldEmail === input.email)
      throw new BadRequestException('Choose a different email');
    const oldToken = randomBytes(32).toString('hex'),
      newToken = randomBytes(32).toString('hex');
    await this.manager.transaction(async (manager) => {
      const [account] = await manager.query<{ email: string }[]>(
        'SELECT email FROM "user" WHERE id=$1 FOR UPDATE',
        [user.id],
      );
      if (account?.email.toLowerCase() !== oldEmail)
        throw new UnauthorizedException('Sign in again');
      const addresses = await manager.find(UserEmail, {
        where: { email: exactEmail(oldEmail) },
      });
      if (addresses.length !== 1)
        throw new BadRequestException('Account profile is not available');
      const address = addresses[0];
      await manager.delete(AccountEmailChange, { authUserId: user.id });
      await manager.save(AccountEmailChange, {
        authUserId: user.id,
        userEmailId: address.id,
        oldEmail,
        newEmail: input.email,
        oldTokenHash: hash(oldToken),
        newTokenHash: hash(newToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    });
    const origin = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:4000')
      .split(',')[0]
      .trim();
    await mailer.sendAccountEmailVerification(
      oldEmail,
      `${origin}/onboarding/change-email?token=${oldToken}`,
    );
    await mailer.sendAccountEmailVerification(
      input.email,
      `${origin}/onboarding/change-email?token=${newToken}`,
    );
    return { requested: true };
  }
  @Post('confirm')
  async confirm(
    @Body() input: ConfirmAccountEmailChange,
    @Req() request: Request,
  ) {
    const user = await this.session(request);
    if (!/^[a-f0-9]{64}$/.test(input.token ?? ''))
      throw new BadRequestException('Invalid confirmation');
    return this.manager.transaction(async (manager) => {
      // Same lock order as requesting/replacing a change: account, then token.
      const [account] = await manager.query<{ email: string }[]>(
        'SELECT email FROM "user" WHERE id=$1 FOR UPDATE',
        [user.id],
      );
      const tokenHash = hash(input.token);
      const change = await manager.findOne(AccountEmailChange, {
        where: [
          { authUserId: user.id, oldTokenHash: tokenHash },
          { authUserId: user.id, newTokenHash: tokenHash },
        ],
        lock: { mode: 'pessimistic_write' },
      });
      if (
        !change ||
        change.expiresAt <= new Date() ||
        account?.email.toLowerCase() !== change.oldEmail
      )
        throw new BadRequestException('Invalid or expired confirmation');
      if (
        (tokenHash === change.oldTokenHash && change.oldConfirmed) ||
        (tokenHash === change.newTokenHash && change.newConfirmed)
      )
        throw new BadRequestException('Confirmation already used');
      if (tokenHash === change.oldTokenHash) change.oldConfirmed = true;
      else change.newConfirmed = true;
      if (!change.oldConfirmed || !change.newConfirmed) {
        await manager.save(AccountEmailChange, change);
        return { completed: false };
      }
      // Shares the identity-creation lock with employee invitation acceptance.
      for (const email of [change.oldEmail, change.newEmail].sort()) {
        await manager.query(
          'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
          [`employee-account:${email}`],
        );
      }
      const collision = await manager.findOne(UserEmail, {
        where: { email: exactEmail(change.newEmail) },
      });
      const authCollision = await manager.query<{ id: string }[]>(
        'SELECT id FROM "user" WHERE lower(email)=$1 AND id<>$2',
        [change.newEmail, user.id],
      );
      if (collision || authCollision.length)
        throw new ConflictException('Email change could not be completed');
      const updated = await manager.update(
        UserEmail,
        { id: change.userEmailId, email: exactEmail(change.oldEmail) },
        { email: change.newEmail, isVerified: true },
      );
      if (updated.affected !== 1)
        throw new ConflictException(
          'Account changed; request a new confirmation',
        );
      await manager.query(
        'UPDATE "user" SET email=$1,"emailVerified"=true,"updatedAt"=now() WHERE id=$2',
        [change.newEmail, user.id],
      );
      // Invalidate every old session; next sign-in resolves the same domain user.
      await manager.query('DELETE FROM session WHERE "userId"=$1', [user.id]);
      await manager.delete(AccountEmailChange, { id: change.id });
      return { completed: true };
    });
  }
}
