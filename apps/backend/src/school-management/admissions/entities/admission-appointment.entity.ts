import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { AdmissionAppointmentType } from '@/school-management/admission-appointment-types/entities/admission-appointment-type.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AdmissionAppointmentStatus } from '../enums/admission-appointment-status.enum';
import { AdmissionActivity } from './admission-activity.entity';
import { AdmissionAppointmentAssignee } from './admission-appointment-assignee.entity';
import { AdmissionApplication } from './admission-application.entity';

@ObjectType()
@Entity('admission_appointments')
@Index('idx_admission_appointments_org_scheduled', [
  'organizationId',
  'scheduledAt',
])
@Index('idx_admission_appointments_app', ['applicationId'])
export class AdmissionAppointment extends AbstractEntity<AdmissionAppointment> {
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
  @Column('uuid', { name: 'appointment_type_id', nullable: true })
  appointmentTypeId?: string | null;

  /**
   * Free-text title, used when no appointment type is set (or as an extra label
   * alongside the type). Optional.
   */
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  title?: string | null;

  @Field(() => AdmissionAppointmentType, { nullable: true })
  @ManyToOne(() => AdmissionAppointmentType, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'appointment_type_id' })
  appointmentType?: AdmissionAppointmentType | null;

  @Field(() => Date)
  @Column('timestamptz', { name: 'scheduled_at' })
  scheduledAt: Date;

  /**
   * Optional end of the appointment. `null` = single-point appointment;
   * set = a period (e.g. a multi-day trial week), where `scheduledAt` is the
   * start. Must be after `scheduledAt` when present (enforced in the service).
   */
  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'ends_at', nullable: true })
  endsAt?: Date | null;

  @Field(() => Int, { nullable: true })
  @Column('int', { name: 'duration_minutes', nullable: true })
  durationMinutes?: number | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  location?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  note?: string | null;

  @Field(() => AdmissionAppointmentStatus)
  @Column('enum', {
    enum: AdmissionAppointmentStatus,
    enumName: 'admission_appointment_status_enum',
    default: AdmissionAppointmentStatus.SCHEDULED,
  })
  status: AdmissionAppointmentStatus;

  @Field(() => [AdmissionAppointmentAssignee], { nullable: true })
  @OneToMany(() => AdmissionAppointmentAssignee, (a) => a.appointment)
  assignees?: AdmissionAppointmentAssignee[];

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'created_by_membership_id', nullable: true })
  createdByMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_membership_id' })
  createdByMembership?: Membership | null;

  /**
   * The mirror MEETING activity that surfaces this appointment in the
   * application's activity timeline. Kept in sync on create/update; on hard
   * delete the activity is removed too, on cancel it is intentionally left
   * standing (chronicle history). `SET NULL` so removing the activity
   * independently never breaks the appointment row.
   */
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'activity_id', nullable: true })
  activityId?: string | null;

  @Field(() => AdmissionActivity, { nullable: true })
  @ManyToOne(() => AdmissionActivity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'activity_id' })
  activity?: AdmissionActivity | null;
}
