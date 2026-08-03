import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { EmployeeFunctionTranslation } from './employee-function-translation.entity';

@ObjectType()
@Entity('employee_functions')
@Index('UQ_employee_function_org_name', ['organizationId', 'name'], {
  unique: true,
})
@Index('idx_employee_functions_org', ['organizationId'])
export class EmployeeFunction extends AbstractEntity<EmployeeFunction> {
  /** Canonical label (DE → EN → FR → IT) for uniqueness and legacy contract values. */
  @Field(() => String)
  @Column('varchar', { length: 200 })
  name: string;

  @Field(() => Int)
  @Column('int', { name: 'sort_order', default: 0 })
  sortOrder: number;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Field(() => [EmployeeFunctionTranslation], { nullable: true })
  @OneToMany(() => EmployeeFunctionTranslation, (t) => t.function, {
    cascade: false,
  })
  translations?: EmployeeFunctionTranslation[];

  /** Distinct employees with any contract referencing this function (computed). */
  @Field(() => Int)
  usageCount?: number;
}
