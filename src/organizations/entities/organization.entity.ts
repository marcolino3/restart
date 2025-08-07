import { AbstractEntity } from '@/database/abstract.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  RelationId,
} from 'typeorm';

import { IOrganization } from '@/organizations/interfaces/organization.interface';
import { Country } from '@/countries/entities/country.entity';
import { Address } from '@/addresses/entities/address.entity';
import { User } from '@/users/entities/user.entity';
import { Role } from '@/roles/entities/role.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';

@ObjectType()
@Entity()
export class Organization
  extends AbstractEntity<Organization>
  implements IOrganization
{
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  subDomain?: string;

  @Field(() => String, { nullable: true })
  @RelationId((org: Organization) => org.address)
  addressId?: string;

  @Field(() => Address, { nullable: true })
  @OneToOne(() => Address, { nullable: true, cascade: true })
  @JoinColumn()
  address?: Address;

  @Field(() => String, { nullable: true })
  @RelationId((organization: Organization) => organization.parentOrganization)
  parentOrganizationId?: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(
    () => Organization,
    (organization) => organization.parentOrganization,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: 'parentId' })
  parentOrganization?: Organization;

  @Field(() => [String], { nullable: true })
  @RelationId((organization: Organization) => organization.teams)
  teamIds?: string[];

  @Field(() => [Team], { nullable: true })
  @OneToMany(() => Team, (team) => team.organization, { cascade: true })
  teams?: Team[];

  @Field(() => String, { nullable: true })
  @RelationId((organization: Organization) => organization.country)
  countryId?: string;

  @Field(() => Country, { nullable: true })
  @ManyToOne(() => Country, { nullable: true })
  country?: Country;

  @Field(() => [User], { nullable: true })
  @ManyToMany(() => User, (user) => user.organizations)
  @JoinTable()
  users?: User[];

  roleIds: string[];

  @Field(() => [Role], { nullable: true })
  roles: Role[];
}
