import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Project } from '@/project-management/projects/entities/project.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ProtocolParticipant } from './protocol-participant.entity';
import { ProtocolSections } from './protocol-sections.output';
import { ProtocolStatus } from './protocol-status.enum';

@ObjectType()
@Entity('protocols')
@Index('idx_protocols_org', ['organizationId'])
export class Protocol extends AbstractEntity<Protocol> {
  @Field(() => String)
  @Column('text')
  title: string;

  @Field(() => String, { nullable: true })
  @Column('date', { name: 'meeting_date', nullable: true })
  meetingDate?: string | null;

  // Optional meeting window (HH:MM), shown as "14:00–16:00" in the detail head.
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'start_time', nullable: true })
  startTime?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'end_time', nullable: true })
  endTime?: string | null;

  @Field(() => ProtocolStatus)
  @Column({ type: 'enum', enum: ProtocolStatus, default: ProtocolStatus.DRAFT })
  status: ProtocolStatus;

  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // Optional link to a project; tasks taken from this protocol land on its board.
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'project_id', nullable: true })
  projectId?: string | null;

  @Field(() => Project, { nullable: true })
  @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'created_by_membership_id', nullable: true })
  createdByMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'created_by_membership_id' })
  createdBy?: Membership;

  // Non-member / external attendees (free text).
  @Field(() => [String])
  @Column('text', { name: 'external_participants', array: true, default: '{}' })
  externalParticipants: string[];

  // Structured record sections (agenda, decisions, communications, …) — see
  // ProtocolSections. The actionable "Todos/Massnahmen" are real Tasks, not here.
  @Field(() => ProtocolSections)
  @Column('jsonb', { default: {} })
  sections: ProtocolSections;

  @Field(() => [ProtocolParticipant], { nullable: true })
  @OneToMany(() => ProtocolParticipant, (p) => p.protocol)
  participants?: ProtocolParticipant[];
}
