import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Org-managed expense category for class budgets (e.g. Material, Ausflüge,
 * Bücher). Modeled on StudentRecordCategory — soft-archive + reorderable via
 * AbstractEntity's isArchived + position. Archived instead of deleted so old
 * school years keep their breakdown.
 */
@ObjectType()
@Entity('expense_categories')
@Index('idx_expense_categories_org', ['organizationId'])
@Index('uq_expense_categories_org_name', ['organizationId', 'name'], {
  unique: true,
})
export class ExpenseCategory extends AbstractEntity<ExpenseCategory> {
  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  color?: string | null;

  @Field(() => Int)
  @Column('int', { default: 0 })
  position: number;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
