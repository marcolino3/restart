import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ITeam } from '../interfaces/team.interface';

@ObjectType()
@Entity('teams')
@Index('UQ_team_org_name', ['organizationId', 'name'], { unique: true })
export class Team extends AbstractEntity<Team> implements ITeam {
  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, (organization) => organization.teams)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
