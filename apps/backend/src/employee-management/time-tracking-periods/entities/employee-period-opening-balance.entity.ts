import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { TimeTrackingPeriod } from './time-tracking-period.entity';

/**
 * Eröffnungssaldo (Carry-over) eines Mitarbeiters zu Beginn einer Periode:
 * übertragene Über-/Minuszeit + verbleibende Ferientage aus der Vorperiode.
 * Ersetzt colibri `transferredBalances`.
 */
@ObjectType()
@Entity('employee_period_opening_balances')
@Unique('uq_employee_period_opening_balance', ['employeeId', 'periodId'])
export class EmployeePeriodOpeningBalance extends AbstractEntity<EmployeePeriodOpeningBalance> {
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'employee_id' })
  employeeId!: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Field(() => ID)
  @Column('uuid', { name: 'period_id' })
  periodId!: string;

  @ManyToOne(() => TimeTrackingPeriod, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'period_id' })
  period!: TimeTrackingPeriod;

  @Field(() => Int)
  @Column('int', { name: 'opening_work_minutes', default: 0 })
  openingWorkMinutes!: number;

  @Field(() => Float)
  @Column('numeric', {
    name: 'opening_vacation_days',
    precision: 6,
    scale: 2,
    default: 0,
  })
  openingVacationDays!: number;
}
