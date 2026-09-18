import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { numericAmountTransformer } from '../lib/money';
import { ExpenseCategory } from './expense-category.entity';

/**
 * A single expense booked against a class budget. Counts immediately — there
 * is no approval step. The school year it belongs to is derived from
 * `expenseDate`, never stored.
 */
@ObjectType()
@Check('chk_class_expenses_amount', '"amount" > 0')
@Entity('class_expenses')
@Index('idx_class_expenses_org_class_date', [
  'organizationId',
  'schoolClassId',
  'expenseDate',
])
@Index('idx_class_expenses_category', ['categoryId'])
export class ClassExpense extends AbstractEntity<ClassExpense> {
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

  @Field(() => String)
  @Column('uuid', { name: 'category_id' })
  categoryId: string;

  @Field(() => ExpenseCategory, { nullable: true })
  @ManyToOne(() => ExpenseCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category?: ExpenseCategory;

  /** ISO date (YYYY-MM-DD). */
  @Field(() => String)
  @Column('date', { name: 'expense_date' })
  expenseDate: string;

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
  @Column('varchar', { length: 200, nullable: true })
  vendor?: string | null;

  @Field(() => String, { nullable: true })
  @Column('varchar', { name: 'invoice_number', length: 100, nullable: true })
  invoiceNumber?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string | null;

  /** `<uuid>.<ext>` in private storage; served only via the receipts controller. */
  @Field(() => String, { nullable: true })
  @Column('varchar', { name: 'receipt_file_id', length: 64, nullable: true })
  receiptFileId?: string | null;

  /** Membership that recorded the expense; null for SuperAdmin without one. */
  @Field(() => String, { nullable: true })
  @Column('uuid', { name: 'created_by_membership_id', nullable: true })
  createdByMembershipId?: string | null;
}
