import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, ManyToMany, Unique } from 'typeorm';
import { AbstractEntity } from '@/database/abstract.entity';
import { PermissionCode } from './permission-code.enum';
import { Role } from '@/roles/entities/role.entity';

@ObjectType()
@Entity('permissions')
@Unique('uq_permissions_code', ['code'])
export class Permission extends AbstractEntity<Permission> {
  @Field(() => String)
  @Column('text')
  name!: string;

  @Field(() => PermissionCode)
  @Column({ name: 'code', type: 'enum', enum: PermissionCode })
  code!: PermissionCode;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string;

  @Field(() => [Role], { nullable: true })
  @ManyToMany(() => Role, (role) => role.permissions)
  roles?: Role[];
}
