import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { AdmissionStage } from '@/school-management/admission-stages/entities/admission-stage.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AdmissionAuditAction } from '../enums/admission-audit-action.enum';
import { AdmissionApplication } from './admission-application.entity';

@ObjectType()
@Entity('admission_audit_logs')
@Index('idx_admission_audit_logs_org', ['organizationId'])
@Index('idx_admission_audit_logs_app', ['applicationId'])
export class AdmissionAuditLog extends AbstractEntity<AdmissionAuditLog> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'application_id' })
  applicationId: string;

  @Field(() => AdmissionApplication, { nullable: true })
  @ManyToOne(() => AdmissionApplication, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application?: AdmissionApplication;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'actor_membership_id', nullable: true })
  actorMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_membership_id' })
  actorMembership?: Membership | null;

  @Field(() => AdmissionAuditAction)
  @Column('enum', { enum: AdmissionAuditAction })
  action: AdmissionAuditAction;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'from_stage_id', nullable: true })
  fromStageId?: string | null;

  @Field(() => AdmissionStage, { nullable: true })
  @ManyToOne(() => AdmissionStage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'from_stage_id' })
  fromStage?: AdmissionStage | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'to_stage_id', nullable: true })
  toStageId?: string | null;

  @Field(() => AdmissionStage, { nullable: true })
  @ManyToOne(() => AdmissionStage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'to_stage_id' })
  toStage?: AdmissionStage | null;

  @Field(() => String, { nullable: true })
  @Column('varchar', { name: 'field_name', length: 120, nullable: true })
  fieldName?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'old_value', nullable: true })
  oldValue?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'new_value', nullable: true })
  newValue?: string | null;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, unknown> | null;
}
