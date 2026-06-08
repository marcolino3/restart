import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ITeam } from '../interfaces/team.interface';

@ObjectType()
@Entity('teams')
@Index('UQ_team_org_name', ['organizationId', 'name'], { unique: true })
export class Team extends AbstractEntity<Team> implements ITeam {
  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => Int)
  @Column('integer', { default: 0 })
  sortOrder: number;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, (organization) => organization.teams)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // Self-referencing parent for nesting (adjacency list). A team with a parent
  // is a sub-team; members/leads of an ancestor inherit access downward.
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'parent_id', nullable: true })
  parentId?: string | null;

  @ManyToOne(() => Team, (team) => team.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Team | null;

  @OneToMany(() => Team, (team) => team.parent)
  children?: Team[];
}
