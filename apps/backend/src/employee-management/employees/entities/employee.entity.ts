import { AbstractEntity } from '@/database/abstract.entity';
import { EmployeeAbsence } from '@/employee-management/employee-absences/entities/employee-absence.entity';
import { EmployeeNote } from '@/employee-management/employee-notes/entities/employee-note.entity';
import { TeamMember } from '@/employee-management/team-members/entities/team-member.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

// Lifecycle status of an employee record. DRAFT = incomplete onboarding
// (created by the wizard, auto-saved, not yet invited); ACTIVE = finalized.
export enum EmployeeStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
}

registerEnumType(EmployeeStatus, { name: 'EmployeeStatus' });

// Invitation lifecycle for the employee's first login (better-auth password
// reset). PENDING = not sent yet; SCHEDULED = queued for the entry date;
// SENT = invitation e-mail dispatched.
export enum EmployeeInvitationStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
}

registerEnumType(EmployeeInvitationStatus, {
  name: 'EmployeeInvitationStatus',
});

@ObjectType()
@Entity('employees')
export class Employee extends AbstractEntity<Employee> {
  @Field(() => Membership)
  @OneToOne(() => Membership, (membership) => membership.employee)
  membership: Membership;

  @Field(() => EmployeeStatus)
  @Column({
    name: 'status',
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  status!: EmployeeStatus;

  @Field(() => EmployeeInvitationStatus)
  @Column({
    name: 'invitation_status',
    type: 'enum',
    enum: EmployeeInvitationStatus,
    default: EmployeeInvitationStatus.PENDING,
  })
  invitationStatus!: EmployeeInvitationStatus;

  // When set (and invitationStatus = SCHEDULED), the nightly cron sends the
  // invitation on/after this instant (typically the contract start date).
  @Field(() => Date, { nullable: true })
  @Column({
    name: 'invitation_scheduled_send_at',
    type: 'timestamptz',
    nullable: true,
  })
  invitationScheduledSendAt?: Date | null;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'invited_at', type: 'timestamptz', nullable: true })
  invitedAt?: Date | null;

  @Field(() => Boolean)
  @Column({ name: 'time_tracking_enabled', type: 'boolean', default: false })
  timeTrackingEnabled!: boolean;

  @Field(() => EmployeeAbsence, { nullable: true })
  @OneToMany(
    () => EmployeeAbsence,
    (employeeAbsence) => employeeAbsence.employee,
    { nullable: true },
  )
  absences?: EmployeeAbsence[];

  @Field(() => [EmployeeNote], { nullable: true })
  @OneToMany(() => EmployeeNote, (employeeNote) => employeeNote.employee, {
    nullable: true,
  })
  notes?: EmployeeNote[];

  @Field(() => [TeamMember], { nullable: true })
  @OneToMany(() => TeamMember, (teamMember) => teamMember.employee, {
    nullable: true,
  })
  teamMembers?: TeamMember[];
}
