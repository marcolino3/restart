import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  Unique,
} from 'typeorm';
import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Permission } from '@/permissions/entities/permission.entity';
import { SystemRole } from './system-role.enum';

@ObjectType()
@Entity('roles')
@Unique('uq_roles_org_name', ['organizationId', 'name'])
@Index('idx_roles_org', ['organizationId'])
// einzigartig nur fuer Systemrollen (mehrere NULLs zulaessig, aber nicht mehrere gleiche Codes)
@Index('uq_roles_org_system_code_not_null', ['organizationId', 'systemCode'], {
  unique: true,
  where: 'system_code IS NOT NULL',
})
export class Role extends AbstractEntity<Role> {
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string | null;

  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @Field(() => Organization)
  @ManyToOne(() => Organization, (organization) => organization.roles, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Field(() => SystemRole, { nullable: true })
  @Column({
    name: 'system_code',
    type: 'enum',
    enum: SystemRole,
    nullable: true,
  })
  systemCode: SystemRole | null;

  @Field()
  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  @Field(() => [Permission], { nullable: true })
  @ManyToMany(() => Permission, (perm) => perm.roles, { eager: false })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions?: Permission[];

  // Inverse Seite zu Membership<->Role (Owner ist Membership)
  @Field(() => [Membership], { nullable: true })
  @ManyToMany(() => Membership, (membership) => membership.roles)
  memberships?: Membership[];
}
