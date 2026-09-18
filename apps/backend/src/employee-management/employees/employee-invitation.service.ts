import { mailer } from '@/lib/mailer';
import { EmployeeAccountInvitation } from './entities/employee-account-invitation.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectEntityManager } from '@nestjs/typeorm';
import { randomBytes, createHash } from 'crypto';
import { EntityManager, LessThanOrEqual } from 'typeorm';
import { Employee, EmployeeInvitationStatus } from './entities/employee.entity';

/**
 * Sends a purpose-bound invitation, accepted explicitly by the signed-in
 * account owner. Creating an invitation never creates or resets an account.
 *
 * Callable from three places (see plan): the finalize resolver (immediate),
 * the nightly cron (scheduled for the entry date) and a manual admin mutation.
 */
@Injectable()
export class EmployeeInvitationService {
  private readonly logger = new Logger(EmployeeInvitationService.name);

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  /** Web base URL for the explicit account-link confirmation. */
  private webBaseUrl(): string {
    const first = (process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)[0];
    return first || 'http://localhost:4000';
  }

  /**
   * Send a fresh purpose-bound link and revoke the previous token. Account
   * creation and membership activation happen only during acceptance.
   */
  async sendInvite(
    employeeId: string,
    organizationId: string,
    manager: EntityManager = this.entityManager,
  ): Promise<void> {
    if (!manager.queryRunner?.isTransactionActive) {
      return manager.transaction((transaction) =>
        this.sendInvite(employeeId, organizationId, transaction),
      );
    }
    await manager.findOneOrFail(Organization, {
      where: { id: organizationId },
      lock: { mode: 'pessimistic_write' },
    });
    const employee = await manager.findOne(Employee, {
      where: { id: employeeId, organizationId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    const email = employee.profile.email?.trim().toLowerCase();
    if (!email) throw new NotFoundException('Employee has no invitation email');
    if (employee.accountLinkStatus !== 'UNLINKED') return;
    const organization = await manager.findOneOrFail(Organization, {
      where: { id: organizationId },
    });
    const token = randomBytes(32).toString('hex');
    await manager.delete(EmployeeAccountInvitation, {
      employeeId,
      organizationId,
    });
    await manager.save(EmployeeAccountInvitation, {
      employeeId,
      organizationId,
      email,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });
    await mailer.sendEmployeeInvitation(
      email,
      `${this.webBaseUrl()}/onboarding/accept-employee?token=${token}`,
      organization.name ?? 'Restart',
    );

    // 3) Mark as invited.
    await manager.update(
      Employee,
      { id: employee.id },
      {
        invitationStatus: EmployeeInvitationStatus.SENT,
        invitedAt: new Date(),
        invitationScheduledSendAt: null,
      },
    );
    this.logger.log(`Invitation sent for employee ${employee.id}`);
  }

  /** Queue the invitation for a future send (typically the entry date). */
  async scheduleInvite(
    employeeId: string,
    sendAt: Date,
    manager: EntityManager = this.entityManager,
  ): Promise<void> {
    await manager.update(
      Employee,
      { id: employeeId },
      {
        invitationStatus: EmployeeInvitationStatus.SCHEDULED,
        invitationScheduledSendAt: sendAt,
      },
    );
  }

  /**
   * Nightly job: dispatch every invitation whose scheduled send time has
   * arrived. Each employee is processed independently so one failure doesn't
   * block the rest.
   */
  @Cron('0 2 * * *', { timeZone: 'Europe/Zurich' })
  async sendDueScheduledInvitations(now: Date = new Date()): Promise<void> {
    const due = await this.entityManager.find(Employee, {
      where: {
        invitationStatus: EmployeeInvitationStatus.SCHEDULED,
        invitationScheduledSendAt: LessThanOrEqual(now),
      },
      relations: { membership: true },
    });
    for (const employee of due) {
      try {
        await this.sendInvite(employee.id, employee.organizationId);
      } catch (err) {
        this.logger.error(
          `Scheduled invitation failed for employee ${employee.id}: ${(err as Error).message}`,
        );
      }
    }
  }
}
