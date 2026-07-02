import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Ausbezahlte Überzeit — reduziert den laufenden Arbeitssaldo.
 * Ersetzt colibri `employeePaidOvertime`.
 */
@ObjectType()
@Entity('employee_paid_overtime')
@Index('idx_employee_paid_overtime_employee', ['employeeId', 'date'])
export class EmployeePaidOvertime extends AbstractEntity<EmployeePaidOvertime> {
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

  @Field(() => String)
  @Column('date')
  date!: string;

  @Field(() => Int)
  @Column('int')
  minutes!: number;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  note!: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'created_by_membership_id', nullable: true })
  createdByMembershipId!: string | null;
}
