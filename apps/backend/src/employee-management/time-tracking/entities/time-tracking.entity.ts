import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@ObjectType()
@Entity('time_tracking_entries')
@Index('IDX_time_tracking_employee_started', ['employeeId', 'startedAt'])
export class TimeTracking extends AbstractEntity<TimeTracking> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => String)
  @Column('uuid', { name: 'employee_id' })
  employeeId: string;

  @Field(() => Employee, { nullable: true })
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Field(() => Date)
  @Column('timestamptz', { name: 'started_at' })
  startedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'ended_at', nullable: true })
  endedAt?: Date;

  @Field(() => Int, { nullable: true })
  @Column('integer', { name: 'break_minutes', nullable: true })
  breakMinutes?: number;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  notes?: string;
}
