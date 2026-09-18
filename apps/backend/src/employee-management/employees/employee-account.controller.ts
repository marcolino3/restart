import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { EntityManager, Raw } from 'typeorm';
import { createHash } from 'node:crypto';
import { Request } from 'express';
import { IsString, Matches } from 'class-validator';
import { auth } from '@/lib/auth';
import { User } from '@/users/entities/user.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { EmployeeAccountInvitation } from './entities/employee-account-invitation.entity';
import { Employee } from './entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';

class AcceptEmployeeInvitationInput {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  token!: string;
}

@Controller('employee-account')
export class EmployeeAccountController {
  constructor(private readonly manager: EntityManager) {}

  @Post('preview')
  async preview(@Body() input: AcceptEmployeeInvitationInput) {
    if (!/^[a-f0-9]{64}$/.test(input.token ?? ''))
      throw new BadRequestException('Invalid invitation');
    const invitation = await this.manager.findOne(EmployeeAccountInvitation, {
      where: {
        tokenHash: createHash('sha256').update(input.token).digest('hex'),
      },
      relations: { employee: { organization: true } },
    });
    if (
      !invitation ||
      invitation.consumedAt ||
      invitation.expiresAt <= new Date() ||
      invitation.employee.profile.email !== invitation.email
    )
      throw new BadRequestException('Invalid invitation');
    return { organizationName: invitation.employee.organization.name };
  }

  /** No active organization is needed: a new account has no membership yet. */
  @Post('accept')
  async accept(
    @Body() input: AcceptEmployeeInvitationInput,
    @Req() request: Request,
  ) {
    if (!/^[a-f0-9]{64}$/.test(input.token ?? ''))
      throw new BadRequestException('Invalid invitation');
    const session = await auth.api.getSession({
      headers: request.headers as unknown as Headers,
    });
    if (!session?.user)
      throw new UnauthorizedException(
        'Sign in before accepting the invitation',
      );
    const email = session.user.email.toLowerCase().trim();
    return this.manager.transaction(async (manager) => {
      const tokenHash = createHash('sha256').update(input.token).digest('hex');
      const candidate = await manager.findOne(EmployeeAccountInvitation, {
        where: { tokenHash },
      });
      if (!candidate)
        throw new BadRequestException('Invitation expired or already used');
      await manager.findOneOrFail(Organization, {
        where: { id: candidate.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      const employee = await manager.findOne(Employee, {
        where: {
          id: candidate.employeeId,
          organizationId: candidate.organizationId,
        },
        lock: { mode: 'pessimistic_write' },
      });
      const invitation = await manager.findOne(EmployeeAccountInvitation, {
        where: { tokenHash },
        lock: { mode: 'pessimistic_write' },
      });
      if (
        !invitation ||
        invitation.consumedAt ||
        invitation.expiresAt <= new Date()
      )
        throw new BadRequestException('Invitation expired or already used');
      if (invitation.email !== email)
        throw new ForbiddenException('Sign in with the invited email address');
      if (
        !employee ||
        employee.accountLinkStatus !== 'UNLINKED' ||
        employee.profile.email !== invitation.email
      )
        throw new BadRequestException('Invitation is no longer valid');
      // The same new account may accept invitations from two organizations.
      // Serialize domain-identity creation without disclosing account existence.
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`employee-account:${email}`],
      );
      const addresses = await manager.find(UserEmail, {
        where: {
          email: Raw((column) => `LOWER(${column}) = :email`, { email }),
        },
      });
      if (addresses.length > 1)
        throw new BadRequestException('Account profile is ambiguous');
      let address: UserEmail | undefined = addresses[0];
      if (!address) {
        const user = await manager.save(User, {
          firstName: (session.user.name || email).slice(0, 120),
          lastName: '',
        });
        address = await manager.save(UserEmail, {
          userId: user.id,
          email,
          isPrimary: true,
          isVerified: true,
        });
      }
      const pending = await manager.findOneOrFail(Membership, {
        where: {
          employeeId: employee.id,
          organizationId: employee.organizationId,
        },
        relations: ['roles'],
      });
      const existing = await manager.findOne(Membership, {
        where: {
          userId: address.userId,
          organizationId: employee.organizationId,
        },
        relations: ['roles'],
      });
      if (existing?.employeeId && existing.employeeId !== employee.id)
        throw new BadRequestException(
          'Account already linked to another employee in this organization',
        );
      if (existing && existing.id !== pending.id) {
        await manager.update(
          Membership,
          { id: pending.id },
          { employeeId: null },
        );
        existing.employeeId = employee.id;
        existing.isActive = true;
        existing.userEmailId = address.id;
        existing.persona = pending.persona;
        existing.contactPhone = pending.contactPhone;
        existing.contactPhone2 = pending.contactPhone2;
        existing.roles = [
          ...new Map(
            [...(existing.roles ?? []), ...(pending.roles ?? [])].map(
              (role) => [role.id, role],
            ),
          ).values(),
        ];
        await manager.save(Membership, existing);
        await manager.remove(Membership, pending);
      } else {
        pending.userId = address.userId;
        pending.userEmailId = address.id;
        pending.isActive = true;
        await manager.save(Membership, pending);
      }
      employee.accountLinkStatus = 'CONFIRMED';
      await manager.save(Employee, employee);
      invitation.consumedAt = new Date();
      await manager.save(EmployeeAccountInvitation, invitation);
      return { organizationId: employee.organizationId };
    });
  }
}
