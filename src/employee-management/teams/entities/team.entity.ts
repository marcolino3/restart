import { AbstractEntity } from '@/database/abstract.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Organization } from '@/organizations/entities/organization.entity';
import { TeamMembership } from './team-membership.entity';
import { ITeam } from '../interfaces/team.interface';

@ObjectType()
@Entity('teams')
export class Team extends AbstractEntity<Team> implements ITeam {
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  name?: string;

  @Field(() => Team, { nullable: true })
  @ManyToOne(() => Team, (team) => team.parentTeam)
  parentTeam?: Team;

  @Field(() => String, { nullable: true })
  @RelationId((team: Team) => team.parentTeam)
  parentTeamId?: string;

  @Field(() => Organization, { nullable: false })
  @ManyToOne(() => Organization, (organization) => organization.teams, {
    nullable: false,
  })
  organization?: Organization;

  @Field(() => String, { nullable: true })
  @RelationId((team: Team) => team.organization)
  organizationId?: string;

  @Field(() => [TeamMembership])
  @OneToMany(() => TeamMembership, (membership) => membership.team)
  members: TeamMembership[];
}
