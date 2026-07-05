import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { RetentionAction } from '../enums/retention-action.enum';
import { RetentionEntityType } from '../enums/retention-entity-type.enum';

/**
 * Org-configurable retention rule for one record type (Aufbewahrungsfrist,
 * DSGVO Art. 5(1)(e)). Exactly one policy per (org, entityType). Execution of
 * the rule is deliberately NOT part of this entity — an admin-reviewed purge
 * job (see DSG-07) consumes these policies; here they are configured and their
 * currently-due counts previewed.
 */
@ObjectType()
@Entity('retention_policies')
@Index('idx_retention_policies_org', ['organizationId'])
@Index('UQ_retention_policy_org_entity', ['organizationId', 'entityType'], {
  unique: true,
})
export class RetentionPolicy extends AbstractEntity<RetentionPolicy> {
  @Field(() => RetentionEntityType)
  @Column('enum', { enum: RetentionEntityType, name: 'entity_type' })
  entityType: RetentionEntityType;

  /** Months to keep after the anchor date before the action applies. */
  @Field(() => Int)
  @Column('int', { name: 'retention_months' })
  retentionMonths: number;

  @Field(() => RetentionAction)
  @Column('enum', {
    enum: RetentionAction,
    name: 'action',
    default: RetentionAction.ANONYMIZE,
  })
  action: RetentionAction;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string | null;

  @Field(() => Boolean)
  @Column('boolean', { name: 'is_enabled', default: true })
  isEnabled: boolean;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
