import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Column, Entity, OneToMany, Index, RelationId } from 'typeorm';

import { AbstractEntity } from '@/database/abstract.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { IOrganization } from '@/organizations/interfaces/organization.interface';
import { Role } from '@/roles/entities/role.entity';

@ObjectType()
@Entity('organizations')
@Index('uq_organizations_slug', ['slug'], { unique: true })
export class Organization
  extends AbstractEntity<Organization>
  implements IOrganization
{
  @Field()
  @Column({ name: 'name', type: 'varchar', length: 200 })
  name!: string;

  @Field()
  @Column({ name: 'slug', type: 'varchar', length: 120, unique: true })
  slug!: string;

  @Field(() => [Membership], { nullable: true })
  @OneToMany(() => Membership, (membership) => membership.organization)
  memberships?: Membership[];

  @Field(() => [Role], { nullable: true })
  @OneToMany(() => Role, (role) => role.organization)
  roles?: Role[];

  // Praktisch, wenn du nur IDs brauchst (keine eigene DB-Spalte!)
  @Field(() => [ID], { nullable: true })
  @RelationId((org: Organization) => org.teams)
  teamIds?: string[];

  @Field(() => [Team], { nullable: true })
  @OneToMany(() => Team, (team) => team.organization)
  teams?: Team[];
}
