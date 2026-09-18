import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from '@/organizations/entities/organization.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Shift } from '@/employee-management/shifts/entities/shift.entity';
import { ShiftPlan } from './shift-plan.entity';

/** One employee working one shift on one day of a plan. */
@ObjectType()
@Entity('shift_assignments')
@Index('UQ_shift_assignment', ['planId', 'date', 'shiftId', 'employeeId'], {
  unique: true,
})
@Index('IDX_shift_assignments_org_employee_date', [
  'organizationId',
  'employeeId',
  'date',
])
export class ShiftAssignment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'plan_id' })
  planId!: string;

  @ManyToOne(() => ShiftPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan!: ShiftPlan;

  /** YYYY-MM-DD */
  @Field(() => String)
  @Column('date')
  date!: string;

  @Field(() => ID)
  @Column('uuid', { name: 'shift_id' })
  shiftId!: string;

  @Field(() => Shift, { nullable: true })
  @ManyToOne(() => Shift, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shift_id' })
  shift?: Shift;

  @Field(() => ID)
  @Column('uuid', { name: 'employee_id' })
  employeeId!: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;
}
