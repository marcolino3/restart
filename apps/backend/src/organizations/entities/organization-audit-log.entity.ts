import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { User } from '@/users/entities/user.entity';

// action is a plain varchar validated against the TS enum in
// packages/shared-schemas/src/organizations/organization-enums.ts, not a PG
// enum — new actions must not require a migration (CLAUDE.md 55P04 rule),
// mirrors organization_feature_toggles.feature_key.
@ObjectType()
@Entity('organization_audit_logs')
@Index('idx_org_audit_logs_org_created', ['organizationId', 'createdAt'])
export class OrganizationAuditLog extends AbstractEntity<OrganizationAuditLog> {
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'actor_user_id', nullable: true })
  actorUserId?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser?: User;

  @Field()
  @Column({ name: 'action', type: 'varchar', length: 50 })
  action!: string;

  // Not GraphQL-exposed: structured audit fields are added to the
  // ObjectType as needed instead of a raw JSON scalar (no graphql-type-json
  // dependency in this repo).
  @Column({ name: 'payload', type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;
}
