import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { User } from '@/users/entities/user.entity';

// featureKey is a plain varchar validated against the TS catalog in
// packages/shared-schemas/src/org-features/feature-catalog.ts, not a PG
// enum — new feature keys must not require a migration (see CLAUDE.md
// 55P04 rule), mirrors role_field_permissions.resource/field.
@ObjectType()
@Entity('organization_feature_toggles')
@Index('uq_org_feature_toggles_org_feature', ['organizationId', 'featureKey'], {
  unique: true,
})
@Index('idx_org_feature_toggles_org', ['organizationId'])
export class OrganizationFeatureToggle extends AbstractEntity<OrganizationFeatureToggle> {
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Field()
  @Column({ name: 'feature_key', type: 'varchar', length: 100 })
  featureKey!: string;

  @Field()
  @Column({ name: 'enabled', type: 'boolean', default: true })
  enabled!: boolean;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'changed_by', nullable: true })
  changedById?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by' })
  changedBy?: User;
}
