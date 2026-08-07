import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { CompanyVacation } from '@/employee-management/company-vacations/entities/company-vacation.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@ObjectType()
@Entity('company_vacation_assignments')
@Index('UQ_company_vacation_assignment', ['companyVacationId', 'employeeId'], {
  unique: true,
})
@Index('idx_company_vacation_assignments_employee', ['employeeId'])
export class CompanyVacationAssignment extends AbstractEntity<CompanyVacationAssignment> {
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'company_vacation_id' })
  companyVacationId!: string;

  @Field(() => CompanyVacation)
  @ManyToOne(() => CompanyVacation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_vacation_id' })
  companyVacation!: CompanyVacation;

  @Field(() => ID)
  @Column('uuid', { name: 'employee_id' })
  employeeId!: string;

  @Field(() => Employee)
  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;
}
