import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import { SmtpService } from '@/school-management/admissions/smtp.service';
import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { EntityManager } from 'typeorm';
import { EmployeeContract } from '../employee-contracts/entities/employee-contract.entity';
import { SICK_LEAVE_SETTING_KEYS } from './sick-leave-setting-keys';
import {
  sickLeaveNotificationHtml,
  sickLeaveNotificationSubject,
} from './templates/sick-leave-notification.template';

/** Mirrors `MAX_TEAM_DEPTH` in `TeamAccessService` — guards runaway recursion. */
const MAX_TEAM_DEPTH = 10;

export interface SickLeaveNotificationInput {
  organizationId: string;
  /** Employee reporting sick — excluded from the recipient list. */
  employeeId: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  startTime?: string | null;
  comment?: string | null;
  /** True when an existing absence was extended rather than newly created. */
  isExtension: boolean;
}

export interface SickLeaveRecipient {
  email: string;
  name?: string | null;
}

/**
 * Notifies leadership about a self-reported sick leave.
 *
 * Delivery is best-effort: a failing mail server must never roll back an
 * absence that is already persisted, so every error is logged and swallowed.
 * Call only AFTER the absence transaction has committed.
 */
@Injectable()
export class SickLeaveNotificationService {
  private readonly logger = new Logger(SickLeaveNotificationService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly smtp: SmtpService,
    private readonly organizationSettings: OrganizationSettingsService,
  ) {}

  async notify(input: SickLeaveNotificationInput): Promise<void> {
    let recipients: SickLeaveRecipient[];
    try {
      recipients = await this.resolveRecipients(input);
    } catch (error) {
      this.logger.warn(
        `Could not resolve sick-leave recipients for employee ${input.employeeId}: ${toMessage(error)}`,
      );
      return;
    }

    if (recipients.length === 0) {
      this.logger.warn(
        `No sick-leave recipients configured for organization ${input.organizationId}`,
      );
      return;
    }

    const data = {
      employeeName: input.employeeName,
      startDate: formatDate(input.startDate),
      endDate: formatDate(input.endDate),
      startTime: input.startTime ? formatTime(input.startTime) : null,
      comment: input.comment ?? null,
      isExtension: input.isExtension,
    };
    const subject = sickLeaveNotificationSubject(data);
    const html = sickLeaveNotificationHtml(data);

    // Sequential on purpose: a shared SMTP relay is happier with a few serial
    // messages than with a burst, and the recipient count is small.
    for (const recipient of recipients) {
      try {
        await this.smtp.send({
          organizationId: input.organizationId,
          to: recipient.email,
          toName: recipient.name,
          subject,
          html,
        });
      } catch (error) {
        this.logger.warn(
          `Sick-leave mail to ${recipient.email} failed: ${toMessage(error)}`,
        );
      }
    }
  }

  /**
   * Team leads (own teams plus every ancestor team), the contractual supervisor
   * and the org's fixed notification address — deduplicated by lowercased
   * address, with the reporting employee removed.
   */
  async resolveRecipients(
    input: Pick<SickLeaveNotificationInput, 'organizationId' | 'employeeId'>,
  ): Promise<SickLeaveRecipient[]> {
    const { organizationId, employeeId } = input;

    const [leads, supervisor, fixedAddress, ownEmails] = await Promise.all([
      this.findTeamLeadRecipients(organizationId, employeeId),
      this.findSupervisorRecipient(organizationId, employeeId),
      this.organizationSettings.getDecryptedValue(
        organizationId,
        SICK_LEAVE_SETTING_KEYS.notificationEmail,
      ),
      this.findOwnEmails(organizationId, employeeId),
    ]);

    const candidates: SickLeaveRecipient[] = [...leads];
    if (supervisor) candidates.push(supervisor);
    if (fixedAddress?.trim()) {
      candidates.push({ email: fixedAddress.trim(), name: null });
    }

    const excluded = new Set(ownEmails.map((e) => e.toLowerCase()));
    const seen = new Set<string>();
    const result: SickLeaveRecipient[] = [];
    for (const candidate of candidates) {
      const key = candidate.email.trim().toLowerCase();
      if (!key || excluded.has(key) || seen.has(key)) continue;
      seen.add(key);
      result.push({ email: candidate.email.trim(), name: candidate.name });
    }
    return result;
  }

  /**
   * Leads of every team the employee belongs to and of all ANCESTOR teams —
   * the opposite direction from `TeamAccessService`, which walks downwards to
   * answer "what may this lead see".
   */
  private async findTeamLeadRecipients(
    organizationId: string,
    employeeId: string,
  ): Promise<SickLeaveRecipient[]> {
    const rows: Array<{
      email: string;
      first_name: string | null;
      last_name: string | null;
    }> = await this.entityManager.query(
      `
      WITH RECURSIVE own_teams AS (
        SELECT tm.team_id
        FROM team_members tm
        WHERE tm.employee_id = $1
          AND tm.organization_id = $2
          AND tm."isActive" = true
      ),
      ancestors AS (
        SELECT t.id AS team_id, t.parent_id, 1 AS lvl
        FROM own_teams o
        JOIN teams t
          ON t.id = o.team_id
         AND t.organization_id = $2
         AND t."isActive" = true
        UNION ALL
        SELECT p.id AS team_id, p.parent_id, a.lvl + 1 AS lvl
        FROM ancestors a
        JOIN teams p
          ON p.id = a.parent_id
         AND p.organization_id = $2
         AND p."isActive" = true
        WHERE a.lvl < ${MAX_TEAM_DEPTH}
      )
      SELECT DISTINCT ue.email, u."firstName" AS first_name, u."lastName" AS last_name
      FROM (SELECT DISTINCT team_id FROM ancestors) scope
      JOIN team_members lead
        ON lead.team_id = scope.team_id
       AND lead.organization_id = $2
       AND lead."isActive" = true
       AND lead.role = 'LEAD'
      JOIN memberships m
        ON m.employee_id = lead.employee_id
       AND m.organization_id = $2
       AND m."isActive" = true
      JOIN user_emails ue ON ue.id = m.user_email_id
      JOIN users u ON u.id = m.user_id
      WHERE lead.employee_id <> $1
      `,
      [employeeId, organizationId],
    );

    return rows.map((r) => ({
      email: r.email,
      name: joinName(r.first_name, r.last_name),
    }));
  }

  /** Supervisor from the employee's currently active contract, if any. */
  private async findSupervisorRecipient(
    organizationId: string,
    employeeId: string,
  ): Promise<SickLeaveRecipient | null> {
    const today = DateTime.now().toISODate();

    const contract = await this.entityManager
      .createQueryBuilder(EmployeeContract, 'contract')
      .leftJoinAndSelect('contract.supervisor', 'supervisor')
      .leftJoinAndSelect('supervisor.userEmail', 'supervisorEmail')
      .leftJoinAndSelect('supervisor.user', 'supervisorUser')
      .where('contract.organization_id = :organizationId', { organizationId })
      .andWhere('contract.employee_id = :employeeId', { employeeId })
      .andWhere('contract."isActive" = true')
      .andWhere('contract.supervisor_membership_id IS NOT NULL')
      .andWhere('contract."startDate" <= :today', { today })
      .andWhere(
        '(contract."endDate" IS NULL OR contract."endDate" >= :today)',
        {
          today,
        },
      )
      .orderBy('contract."startDate"', 'DESC')
      .getOne();

    const supervisor = contract?.supervisor;
    const email = supervisor?.userEmail?.email;
    if (!supervisor || !email) return null;

    // Cross-org safety net: the query is already org-scoped, but the supervisor
    // is a membership row and must belong to the same tenant.
    if (supervisor.organizationId !== organizationId) return null;

    return {
      email,
      name: joinName(
        supervisor.user?.firstName ?? null,
        supervisor.user?.lastName ?? null,
      ),
    };
  }

  /** Every address of the reporting employee, so they never mail themselves. */
  private async findOwnEmails(
    organizationId: string,
    employeeId: string,
  ): Promise<string[]> {
    const rows: Array<{ email: string }> = await this.entityManager.query(
      `
      SELECT ue.email
      FROM memberships m
      JOIN user_emails ue ON ue.user_id = m.user_id
      WHERE m.employee_id = $1
        AND m.organization_id = $2
        AND m."isActive" = true
      `,
      [employeeId, organizationId],
    );
    return rows.map((r) => r.email);
  }
}

function joinName(
  firstName: string | null,
  lastName: string | null,
): string | null {
  const name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return name || null;
}

/** Absence dates are stored as UTC midnight — read them back in UTC. */
function formatDate(date: Date): string {
  return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat('dd.MM.yyyy');
}

function formatTime(value: string): string {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : value;
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
