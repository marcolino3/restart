import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractEntity } from '@/database/abstract.entity';
import { Role } from './role.entity';

// Mirrors FieldAction in packages/shared-schemas/src/rbac/field-catalog.ts.
// Kept local (not cross-package imported) because apps/backend's tsconfig
// uses classic "node" module resolution, which does not honor package.json
// "exports" subpaths — see Phase 3 for the fieldMiddleware that reads the
// full catalog and will need to resolve this properly.
type FieldAction = 'create' | 'read' | 'update' | 'delete';

@ObjectType()
@Entity('role_field_permissions')
@Unique('uq_role_field_permissions_role_resource_field', [
  'roleId',
  'resource',
  'field',
])
@Index('idx_role_field_permissions_role', ['roleId'])
export class RoleFieldPermission extends AbstractEntity<RoleFieldPermission> {
  @Field(() => ID)
  @Column('uuid', { name: 'role_id' })
  roleId!: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Field(() => String)
  @Column('varchar', { length: 100 })
  resource!: string;

  @Field(() => String)
  @Column('varchar', { length: 100 })
  field!: string;

  @Field(() => [String])
  @Column('varchar', { length: 20, array: true, default: '{}' })
  actions!: FieldAction[];
}
