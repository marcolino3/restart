import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@ObjectType()
@Entity('employee_contracts')
export class EmployeeContract extends AbstractEntity<EmployeeContract> {
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
  @Column('date', { name: 'start_date' })
  startDate: Date;

  @Field(() => Date, { nullable: true })
  @Column('date', { name: 'end_date', nullable: true })
  endDate?: Date;

  @Field(() => Float, { nullable: true })
  @Column('numeric', {
    name: 'workload_percent',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  workloadPercent?: number;

  @Field(() => Float, { nullable: true })
  @Column('numeric', {
    name: 'gross_salary',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  grossSalary?: number;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  notes?: string;
}
