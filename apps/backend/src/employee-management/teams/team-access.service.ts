import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamMemberRole } from '../team-members/entities/team-member-role.enum';

export interface EffectiveTeamRole {
  teamId: string;
  role: TeamMemberRole;
}

export interface AccessibleTeamResult {
  team: Team;
  effectiveRole: TeamMemberRole;
}

/** Hard cap on recursion depth — defence-in-depth against malformed cycles. */
const MAX_TEAM_DEPTH = 50;

/**
 * Resolves *effective* team access for an employee, accounting for the team
 * hierarchy. Access propagates downward: a role held on a team also applies to
 * every descendant team, and the strongest role along the chain wins
 * (LEAD > MEMBER).
 *
 * Example: employee is LEAD of "Schulleitung" (parent of "Kindergarten" and
 * "Primar") → effectively LEAD of all three. A MEMBER of "Schulleitung" is
 * effectively MEMBER of the two sub-teams.
 *
 * These results are the scoping basis for downstream features (timesheets,
 * absences): a non-admin lead may only act on employees within the teams they
 * effectively lead.
 */
@Injectable()
export class TeamAccessService {
  constructor(
    @InjectRepository(Team)
    private readonly teamsRepo: Repository<Team>,
  ) {}

  /**
   * Effective role per team for an employee, including all descendant teams of
   * the teams the employee directly belongs to.
   */
  async getEffectiveTeamRoles(
    organizationId: string,
    employeeId: string,
  ): Promise<EffectiveTeamRole[]> {
    const rows: Array<{ team_id: string; role: TeamMemberRole }> =
      await this.teamsRepo.query(
        `
        WITH RECURSIVE seed AS (
          SELECT tm.team_id, tm.role
          FROM team_members tm
          WHERE tm.employee_id = $1
            AND tm.organization_id = $2
            AND tm."isActive" = true
        ),
        descendants AS (
          SELECT t.id AS team_id, s.role, 1 AS lvl
          FROM seed s
          JOIN teams t
            ON t.id = s.team_id
           AND t.organization_id = $2
           AND t."isActive" = true
          UNION ALL
          SELECT c.id AS team_id, d.role, d.lvl + 1 AS lvl
          FROM descendants d
          JOIN teams c
            ON c.parent_id = d.team_id
           AND c.organization_id = $2
           AND c."isActive" = true
          WHERE d.lvl < ${MAX_TEAM_DEPTH}
        )
        SELECT team_id,
          CASE WHEN bool_or(role = 'LEAD') THEN 'LEAD' ELSE 'MEMBER' END AS role
        FROM descendants
        GROUP BY team_id
        `,
        [employeeId, organizationId],
      );

    return rows.map((r) => ({ teamId: r.team_id, role: r.role }));
  }

  /** Team IDs the employee has any effective access to (direct + inherited). */
  async getAccessibleTeamIds(
    organizationId: string,
    employeeId: string,
  ): Promise<string[]> {
    const roles = await this.getEffectiveTeamRoles(organizationId, employeeId);
    return roles.map((r) => r.teamId);
  }

  /**
   * Employee IDs the given employee has access to via the team hierarchy: all
   * members of every team they effectively belong to (directly or inherited).
   * The employee themselves is always included.
   */
  async getAccessibleEmployeeIds(
    organizationId: string,
    employeeId: string,
  ): Promise<string[]> {
    const rows: Array<{ employee_id: string }> = await this.teamsRepo.query(
      `
      WITH RECURSIVE seed AS (
        SELECT tm.team_id, tm.role
        FROM team_members tm
        WHERE tm.employee_id = $1
          AND tm.organization_id = $2
          AND tm."isActive" = true
      ),
      descendants AS (
        SELECT t.id AS team_id, 1 AS lvl
        FROM seed s
        JOIN teams t
          ON t.id = s.team_id
         AND t.organization_id = $2
         AND t."isActive" = true
        UNION ALL
        SELECT c.id AS team_id, d.lvl + 1 AS lvl
        FROM descendants d
        JOIN teams c
          ON c.parent_id = d.team_id
         AND c.organization_id = $2
         AND c."isActive" = true
        WHERE d.lvl < ${MAX_TEAM_DEPTH}
      )
      SELECT DISTINCT tm.employee_id
      FROM (SELECT DISTINCT team_id FROM descendants) acc
      JOIN team_members tm
        ON tm.team_id = acc.team_id
       AND tm.organization_id = $2
       AND tm."isActive" = true
      `,
      [employeeId, organizationId],
    );

    const ids = new Set(rows.map((r) => r.employee_id));
    ids.add(employeeId);
    return [...ids];
  }

  /**
   * Convenience for resolvers that only hold the membership ID from the auth
   * token: resolves the employee behind the membership, then its effective
   * team roles. Returns [] if the membership has no employee record.
   */
  async getEffectiveTeamRolesForMembership(
    organizationId: string,
    membershipId: string,
  ): Promise<EffectiveTeamRole[]> {
    const employeeId = await this.resolveEmployeeId(
      organizationId,
      membershipId,
    );
    if (!employeeId) return [];
    return this.getEffectiveTeamRoles(organizationId, employeeId);
  }

  /**
   * Effective team access for a membership, with the Team entities loaded —
   * ready to surface to the current user (e.g. "teams I belong to / lead").
   */
  async getAccessibleTeamsForMembership(
    organizationId: string,
    membershipId: string,
  ): Promise<AccessibleTeamResult[]> {
    const roles = await this.getEffectiveTeamRolesForMembership(
      organizationId,
      membershipId,
    );
    if (roles.length === 0) return [];

    const teams = await this.teamsRepo.find({
      where: {
        id: In(roles.map((r) => r.teamId)),
        organizationId,
        isActive: true,
      },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    const roleByTeamId = new Map(roles.map((r) => [r.teamId, r.role]));

    return teams.map((team) => ({
      team,
      effectiveRole: roleByTeamId.get(team.id) ?? TeamMemberRole.MEMBER,
    }));
  }

  private async resolveEmployeeId(
    organizationId: string,
    membershipId: string,
  ): Promise<string | null> {
    const rows: Array<{ employee_id: string | null }> =
      await this.teamsRepo.query(
        `
        SELECT employee_id
        FROM memberships
        WHERE id = $1 AND organization_id = $2
        LIMIT 1
        `,
        [membershipId, organizationId],
      );
    return rows[0]?.employee_id ?? null;
  }
}
