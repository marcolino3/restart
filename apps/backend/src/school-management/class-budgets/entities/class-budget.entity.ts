import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { numericAmountTransformer } from '../lib/money';

/**
 * Budget of one class for one school year. `schoolYearStart` is the calendar
 * year the school year starts in (2026 for "2026/27"); the actual date range
 * comes from the org's cut-off, see `school-classes/lib/school-year.ts`.
 */
@ObjectType()
@Check('chk_class_budgets_amount', '"amount" >= 0')
@Entity('class_budgets')
@Index(
  'uq_class_budgets_org_class_year',
  ['organizationId', 'schoolClassId', 'schoolYearStart'],
  { unique: true },
)
export class ClassBudget extends AbstractEntity<ClassBudget> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Field(() => String)
  @Column('uuid', { name: 'school_class_id' })
  schoolClassId: string;

  @Field(() => SchoolClass, { nullable: true })
  @ManyToOne(() => SchoolClass, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_class_id' })
  schoolClass?: SchoolClass;

  @Field(() => Int)
  @Column('int', { name: 'school_year_start' })
  schoolYearStart: number;

  @Field(() => Float)
  @Column('numeric', {
    precision: 12,
    scale: 2,
    transformer: numericAmountTransformer,
  })
  amount: number;

  @Field(() => String)
  @Column('char', { length: 3, default: 'CHF' })
  currency: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  note?: string | null;
}
