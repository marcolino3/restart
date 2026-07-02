import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Persona } from '@/common/enums/persona.enum';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { Membership } from '@/memberships/entities/membership.entity';
import { TeamMember } from '@/employee-management/team-members/entities/team-member.entity';
import { TeamMemberRole } from '@/employee-management/team-members/entities/team-member-role.enum';
import { TeamAccessService } from '@/employee-management/teams/team-access.service';

/**
 * Zentrale Zugriffslogik der Arbeitszeiterfassung. Service-seitig, weil
 * `@AdminPersonaOnly()` Teamleiter (Persona EMPLOYEE + Rolle TEAM_LEAD)
 * aussperren würde.
 *
 * - Lesen fremder Daten: ADMIN/HR → alle; TEAM_LEAD → nur Mitarbeiter
 *   geleiteter Teams; sonst nur eigene. OFFICE hat — anders als im übrigen
 *   Admin-Bereich — KEINEN Zugriff auf fremde Zeitdaten.
 * - Verwalten fremder Daten (Schreiben): nur self oder ADMIN/HR.
 */
const TIME_TRACKING_ADMIN_PERSONAS: ReadonlySet<Persona> = new Set<Persona>([
  Persona.ADMIN,
  Persona.HR,
]);

function isTimeTrackingAdmin(persona: Persona | undefined | null): boolean {
  return !!persona && TIME_TRACKING_ADMIN_PERSONAS.has(persona);
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
    if (isTimeTrackingAdmin(user.persona)) return;
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
    if (user.isSuperAdmin || isTimeTrackingAdmin(user.persona)) return;
    const callerEmployeeId = await this.resolveCallerEmployeeId(user);
    if (callerEmployeeId && callerEmployeeId === targetEmployeeId) return;
    throw new ForbiddenException('Kein Schreibzugriff auf diesen Mitarbeiter.');
  }

  /**
   * Scope für Auswertungs-Listen: null = alle Org-Mitarbeiter (Admin-Persona);
   * sonst erlaubte IDs. Reine Mitarbeiter ohne Lead-Rolle → leere Liste.
   */
  async resolveOverviewScope(
    user: TokenPayload,
    orgId: string,
  ): Promise<string[] | null> {
    if (user.isSuperAdmin || isTimeTrackingAdmin(user.persona)) return null;
    if (!user.roles?.includes(SystemRole.TEAM_LEAD)) return [];
    const callerEmployeeId = await this.resolveCallerEmployeeId(user);
    if (!callerEmployeeId) return [];
    return this.leadScopedEmployeeIds(orgId, callerEmployeeId);
  }
}
