import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AdmissionActivityDirection } from '../enums/admission-activity-direction.enum';
import { AdmissionActivityType } from '../enums/admission-activity-type.enum';
import { AdmissionApplication } from './admission-application.entity';

@ObjectType()
@Entity('admission_activities')
@Index('idx_admission_activities_org', ['organizationId'])
@Index('idx_admission_activities_app_occurred', [
  'applicationId',
  'occurredAt',
])
export class AdmissionActivity extends AbstractEntity<AdmissionActivity> {
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

  @Field(() => AdmissionActivityType)
  @Column('enum', { enum: AdmissionActivityType })
  type: AdmissionActivityType;

  @Field(() => Date)
  @Column('timestamptz', { name: 'occurred_at' })
  occurredAt: Date;

  @Field(() => String, { nullable: true })
  @Column('varchar', { length: 200, nullable: true })
  subject?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  body?: string | null;

  @Field(() => AdmissionActivityDirection, { nullable: true })
  @Column('enum', {
    enum: AdmissionActivityDirection,
    nullable: true,
  })
  direction?: AdmissionActivityDirection | null;

  @Field(() => Int, { nullable: true })
  @Column('integer', { name: 'duration_minutes', nullable: true })
  durationMinutes?: number | null;

  @Field(() => String, { nullable: true })
  @Column('varchar', { length: 200, nullable: true })
  location?: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'created_by_membership_id', nullable: true })
  createdByMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_membership_id' })
  createdByMembership?: Membership | null;
}
