import { auth } from '@/lib/auth';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectEntityManager } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { EntityManager, LessThanOrEqual } from 'typeorm';
import {
  Employee,
  EmployeeInvitationStatus,
} from './entities/employee.entity';

/**
 * Sends the first-login invitation for a newly onboarded employee using
 * better-auth's password-reset primitive (see auth.ts sendResetPassword). The
 * employee sets their own password on /onboarding/set-password.
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

  /** Web base URL for the set-password redirect (first trusted origin). */
  private webBaseUrl(): string {
    const first = (process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)[0];
    return first || 'http://localhost:4000';
  }

  /**
   * Send the invitation now: ensure a better-auth credential user exists, then
   * trigger the reset-password e-mail and mark the employee as invited.
   * Idempotent enough for the cron — re-sending just issues a fresh link.
   */
  async sendInvite(
    employeeId: string,
    organizationId: string,
    manager: EntityManager = this.entityManager,
  ): Promise<void> {
    const employee = await manager.findOne(Employee, {
      where: { id: employeeId },
      relations: { membership: { user: true, userEmail: true } },
    });
    if (!employee || employee.membership?.organizationId !== organizationId) {
      throw new NotFoundException('Employee not found');
    }

    const email = employee.membership.userEmail?.email?.toLowerCase().trim();
    if (!email) {
      throw new NotFoundException('Employee has no e-mail address');
    }
    const user = employee.membership.user;
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

    // 1) Ensure a better-auth credential account exists (login authenticates
    //    against better-auth's own `user`/`account` tables, not user_emails).
    //    Mirrors super-admin-bootstrap.service.ts.
    const existing: Array<{ id: string }> = await manager.query(
      `SELECT id FROM "user" WHERE LOWER(email) = $1 LIMIT 1`,
      [email],
    );
    if (existing.length === 0) {
      await auth.api.signUpEmail({
        body: {
          name: name || email,
          email,
          // Random throwaway password — the employee sets their own via the
          // reset link below. 32 hex chars satisfies better-auth's min length.
          password: randomBytes(16).toString('hex'),
        },
      });
    }

    // 2) Trigger the reset-password e-mail (sendResetPassword callback).
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${this.webBaseUrl()}/onboarding/set-password`,
      },
    });

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
        await this.sendInvite(employee.id, employee.membership.organizationId);
      } catch (err) {
        this.logger.error(
          `Scheduled invitation failed for employee ${employee.id}: ${(err as Error).message}`,
        );
      }
    }
  }
}
