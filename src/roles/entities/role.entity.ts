import { AbstractEntity } from '@/database/abstract.entity';
import { RestartModule } from '@/database/enums/restart-module.enum';
import { Organization } from '@/organizations/entities/organization.entity';
import { Permission } from '@/permissions/entities/permission.entity';
import { User } from '@/users/entities/user.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { IRole } from '@/roles/interfaces/role.interface';

@ObjectType()
@Entity()
export class Role extends AbstractEntity<Role> implements IRole {
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  @RelationId((role: Role) => role.organization)
  organizationId?: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, (organization) => organization.roles)
  organization?: Organization;

  permissions?: Permission;

  modules?: RestartModule;

  users: User[];
}
