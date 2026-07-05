import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ProjectMember } from '@/project-management/project-members/entities/project-member.entity';
import { ProjectStatus } from './project-status.enum';

@ObjectType()
@Entity('projects')
@Index('idx_projects_org', ['organizationId'])
export class Project extends AbstractEntity<Project> {
  @Field(() => String)
  @Column('text')
  title: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string | null;

  @Field(() => ProjectStatus)
  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  // Optional accent colour for the board card / list (hex string), purely UI.
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'color', nullable: true })
  color?: string | null;

  // Optional target date ("Fällig" in list and create dialog), ISO date string.
  @Field(() => String, { nullable: true })
  @Column('date', { name: 'due_date', nullable: true })
  dueDate?: string | null;

  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // The membership that created the project (its "Ersteller"). On creation the
  // creator is also added as an OWNER project member. Null when created by a
  // platform SuperAdmin without an org membership.
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'created_by_membership_id', nullable: true })
  createdByMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_membership_id' })
  createdBy?: Membership;

  @Field(() => [ProjectMember], { nullable: true })
  @OneToMany(() => ProjectMember, (member) => member.project)
  members?: ProjectMember[];
}
