import { registerEnumType } from '@nestjs/graphql';

/**
 * Role an employee holds within a single team.
 *
 * - MEMBER: ordinary team member.
 * - LEAD: team leader. May be assigned to multiple employees per team.
 *
 * Effective access additionally propagates downward through the team tree
 * (see TeamAccessService): a role held on a team also applies to all of that
 * team's descendant teams, taking the strongest role along the ancestor chain.
 */
export enum TeamMemberRole {
  MEMBER = 'MEMBER',
  LEAD = 'LEAD',
}

registerEnumType(TeamMemberRole, {
  name: 'TeamMemberRole',
  description: 'Role of an employee within a team (MEMBER or LEAD)',
});
