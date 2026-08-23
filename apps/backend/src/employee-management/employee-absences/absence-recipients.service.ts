import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { EntityManager } from 'typeorm';
import { EmployeeContract } from '../employee-contracts/entities/employee-contract.entity';
import { SICK_LEAVE_SETTING_KEYS } from '../sick-leave/sick-leave-setting-keys';

/** Mirrors `MAX_TEAM_DEPTH` in `TeamAccessService` — guards runaway recursion. */
const MAX_TEAM_DEPTH = 10;

export interface AbsenceRecipient {
  email: string;
  name?: string | null;
}

/**
 * Who gets told about an employee's absence: team leads (own and ancestor
 * teams), the contractual supervisor and the org's fixed notification address.
 * Shared by the sick-leave report and the absence-request workflow so both
 * reach exactly the same people.
 */
@Injectable()
export class AbsenceRecipientsService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly organizationSettings: OrganizationSettingsService,
  ) {}

  /**
   * Team leads (own teams plus every ancestor team), the contractual supervisor
   * and the org's fixed notification address — deduplicated by lowercased
   * address, with the reporting employee removed.
   */
  async resolveRecipients(input: {
    organizationId: string;
    employeeId: string;
  }): Promise<AbsenceRecipient[]> {
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

    const candidates: AbsenceRecipient[] = [...leads];
    if (supervisor) candidates.push(supervisor);
    if (fixedAddress?.trim()) {
      candidates.push({ email: fixedAddress.trim(), name: null });
    }

    const excluded = new Set(ownEmails.map((e) => e.toLowerCase()));
    const seen = new Set<string>();
    const result: AbsenceRecipient[] = [];
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
  ): Promise<AbsenceRecipient[]> {
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
  ): Promise<AbsenceRecipient | null> {
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

  /** Every address of an employee (all active memberships), e.g. for decision mails. */
  async findEmployeeEmails(
    organizationId: string,
    employeeId: string,
  ): Promise<string[]> {
    return this.findOwnEmails(organizationId, employeeId);
  }
}

function joinName(
  firstName: string | null,
  lastName: string | null,
): string | null {
  const name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return name || null;
}
