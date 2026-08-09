import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { Membership } from '@/memberships/entities/membership.entity';
import { TeamMember } from '@/employee-management/team-members/entities/team-member.entity';
import { TeamMemberRole } from '@/employee-management/team-members/entities/team-member-role.enum';
import { TeamAccessService } from '@/employee-management/teams/team-access.service';

/**
 * Zentrale Zugriffslogik der Arbeitszeiterfassung. Service-seitig, weil ein
 * reiner Guard Teamleiter (Rolle TEAM_LEAD ohne ORG_ADMIN/HR_MANAGER)
 * aussperren würde.
 *
 * - Lesen fremder Daten: ORG_ADMIN/HR_MANAGER → alle; TEAM_LEAD → nur
 *   Mitarbeiter geleiteter Teams; sonst nur eigene.
 * - Verwalten fremder Daten (Schreiben): nur self oder ORG_ADMIN/HR_MANAGER.
 * - Absenzen schreiben: zusätzlich TEAM_LEAD für Mitarbeiter geleiteter Teams
 *   (`assertCanManageAbsence`) — bewusst weiter als generisches Manage.
 */
const TIME_TRACKING_ADMIN_ROLES: ReadonlySet<SystemRole> = new Set([
  SystemRole.ORG_ADMIN,
  SystemRole.HR_MANAGER,
]);

function isTimeTrackingAdmin(roles: string[] | undefined | null): boolean {
  return !!roles?.some((r) => TIME_TRACKING_ADMIN_ROLES.has(r as SystemRole));
}

@Injectable()
export class TimeTrackingAccessService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepo: Repository<TeamMember>,
    private readonly teamAccess: TeamAccessService,
  ) {}

  async resolveCallerEmployeeId(user: TokenPayload): Promise<string | null> {
    if (!user.membershipId || !user.orgId) return null;
    const m = await this.membershipRepo.findOne({
      where: { id: user.membershipId, organizationId: user.orgId },
      select: { id: true, employeeId: true },
    });
    return m?.employeeId ?? null;
  }

  /** Mitarbeiter-IDs der vom Caller GELEITETEN Teams (LEAD), inkl. Descendants. */
  async leadScopedEmployeeIds(
    orgId: string,
    callerEmployeeId: string,
  ): Promise<string[]> {
    const roles = await this.teamAccess.getEffectiveTeamRoles(
      orgId,
      callerEmployeeId,
    );
    const leadTeamIds = roles
      .filter((r) => r.role === TeamMemberRole.LEAD)
      .map((r) => r.teamId);
    if (!leadTeamIds.length) return [];
    const members = await this.teamMemberRepo.find({
      where: { organizationId: orgId, teamId: In(leadTeamIds), isActive: true },
      select: { employeeId: true },
    });
    return [...new Set(members.map((m) => m.employeeId))];
  }

  /** Wirft Forbidden, wenn der Caller den Ziel-Mitarbeiter nicht LESEN darf. */
  async assertCanViewEmployee(
    user: TokenPayload,
    targetEmployeeId: string,
  ): Promise<void> {
    if (user.isSuperAdmin) return;
    const orgId = user.orgId as string;
    const callerEmployeeId = await this.resolveCallerEmployeeId(user);
    if (callerEmployeeId && callerEmployeeId === targetEmployeeId) return;
    if (isTimeTrackingAdmin(user.roles)) return;
    if (
      user.roles?.includes(SystemRole.TEAM_LEAD) &&
      callerEmployeeId &&
      (await this.leadScopedEmployeeIds(orgId, callerEmployeeId)).includes(
        targetEmployeeId,
      )
    ) {
      return;
    }
    throw new ForbiddenException(
      'Kein Zugriff auf die Auswertung dieses Mitarbeiters.',
    );
  }

  /** Wirft Forbidden, wenn der Caller den Ziel-Mitarbeiter nicht VERWALTEN darf. */
  async assertCanManageEmployee(
    user: TokenPayload,
    targetEmployeeId: string,
  ): Promise<void> {
    if (user.isSuperAdmin || isTimeTrackingAdmin(user.roles)) return;
    const callerEmployeeId = await this.resolveCallerEmployeeId(user);
    if (callerEmployeeId && callerEmployeeId === targetEmployeeId) return;
    throw new ForbiddenException('Kein Schreibzugriff auf diesen Mitarbeiter.');
  }

  /**
   * Absenzen schreiben (CRUD + Zertifikat-Upload): Admin/HR, Self, oder
   * TEAM_LEAD für Mitarbeiter geleiteter Teams. Enger als generisches
   * `assertCanManageEmployee` (dort kein Teamleiter-Schreiben auf Zeiteinträge).
   */
  async assertCanManageAbsence(
    user: TokenPayload,
    targetEmployeeId: string,
  ): Promise<void> {
    try {
      await this.assertCanViewEmployee(user, targetEmployeeId);
    } catch {
      throw new ForbiddenException(
        'Kein Schreibzugriff auf Absenzen dieses Mitarbeiters.',
      );
    }
  }

  /**
   * Scope für Auswertungs-Listen: null = alle Org-Mitarbeiter
   * (ORG_ADMIN/HR_MANAGER); sonst erlaubte IDs. Reine Mitarbeiter ohne
   * Lead-Rolle → leere Liste.
   */
  async resolveOverviewScope(
    user: TokenPayload,
    orgId: string,
  ): Promise<string[] | null> {
    if (user.isSuperAdmin || isTimeTrackingAdmin(user.roles)) return null;
    if (!user.roles?.includes(SystemRole.TEAM_LEAD)) return [];
    const callerEmployeeId = await this.resolveCallerEmployeeId(user);
    if (!callerEmployeeId) return [];
    return this.leadScopedEmployeeIds(orgId, callerEmployeeId);
  }
}
