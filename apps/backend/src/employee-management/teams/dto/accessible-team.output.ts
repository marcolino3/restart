import { Field, ObjectType } from '@nestjs/graphql';
import { Team } from '../entities/team.entity';
import { TeamMemberRole } from '../../team-members/entities/team-member-role.enum';

/**
 * A team the current user can access, together with the role that applies after
 * downward inheritance through the team hierarchy.
 */
@ObjectType()
export class AccessibleTeam {
  @Field(() => Team)
  team: Team;

  @Field(() => TeamMemberRole)
  effectiveRole: TeamMemberRole;
}
