import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Persönliche Ferien (Ferienkontingent-Bezug). Bewusst getrennt von
 * EmployeeAbsence, damit Ferien-Saldo (annualVacationDays - bezogen) sauber
 * berechenbar bleibt.
 */
@ObjectType()
@Entity('employee_vacations')
@Index('idx_employee_vacations_employee', ['employeeId'])
@Index('idx_employee_vacations_org', ['organizationId'])
export class EmployeeVacation extends AbstractEntity<EmployeeVacation> {
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
  @Column('uuid', { name: 'membership_id' })
  membershipId!: string;

  @ManyToOne(() => Membership)
  @JoinColumn({ name: 'membership_id' })
  membership!: Membership;

  @Field(() => String, { nullable: true })
  @Column('varchar', { length: 200, nullable: true })
  name!: string | null;

  @Field(() => String)
  @Column('date', { name: 'start_date' })
  startDate!: string;

  @Field(() => String)
  @Column('date', { name: 'end_date' })
  endDate!: string;
}
