import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AdmissionAppointment } from './admission-appointment.entity';

/**
 * Join row assigning a membership to an admission appointment. An appointment
 * can have several assignees (many-to-many via this table), each org-scoped for
 * multi-tenant isolation.
 */
@ObjectType()
@Entity('admission_appointment_assignees')
@Index('idx_admission_appointment_assignees_appointment', ['appointmentId'])
@Index(
  'uq_admission_appointment_assignees',
  ['appointmentId', 'membershipId'],
  { unique: true },
)
export class AdmissionAppointmentAssignee extends AbstractEntity<AdmissionAppointmentAssignee> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => ID)
  @Column('uuid', { name: 'appointment_id' })
  appointmentId: string;

  @ManyToOne(() => AdmissionAppointment, (a) => a.assignees, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: AdmissionAppointment;

  @Field(() => ID)
  @Column('uuid', { name: 'membership_id' })
  membershipId: string;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membership_id' })
  membership?: Membership | null;
}
