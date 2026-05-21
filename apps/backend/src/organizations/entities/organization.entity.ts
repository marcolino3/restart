import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Column, Entity, OneToMany, Index, RelationId } from 'typeorm';

import { AbstractEntity } from '@/database/abstract.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { IOrganization } from '@/organizations/interfaces/organization.interface';
import { Role } from '@/roles/entities/role.entity';

@ObjectType()
@Entity('organizations')
@Index('uq_organizations_subdomain', ['subdomain'], { unique: true })
@Index('uq_organizations_domain', ['domain'], { unique: true })
export class Organization
  extends AbstractEntity<Organization>
  implements IOrganization
{
  @Field({ nullable: true })
  @Column({ name: 'name', type: 'varchar', length: 200, nullable: true })
  name?: string;

  @Field({ nullable: true })
  @Column({
    name: 'subdomain',
    type: 'varchar',
    length: 120,
    unique: true,
    nullable: true,
  })
  subdomain?: string;

  @Field({ nullable: true })
  @Column({
    name: 'domain',
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: true,
  })
  domain?: string;

  @Field({ nullable: true })
  @Column({ name: 'street', type: 'varchar', length: 200, nullable: true })
  street?: string;

  @Field({ nullable: true })
  @Column({ name: 'zip', type: 'varchar', length: 20, nullable: true })
  zip?: string;

  @Field({ nullable: true })
  @Column({ name: 'city', type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Field({ nullable: true })
  @Column({ name: 'country', type: 'varchar', length: 100, nullable: true })
  country?: string;

  @Field({ nullable: true })
  @Column({ name: 'phone', type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Field({ nullable: true })
  @Column({ name: 'email', type: 'varchar', length: 200, nullable: true })
  email?: string;

  @Field({ nullable: true })
  @Column({ name: 'website', type: 'varchar', length: 500, nullable: true })
  website?: string;

  @Field()
  @Column({
    name: 'timezone',
    type: 'varchar',
    length: 100,
    default: 'Europe/Berlin',
  })
  timezone!: string;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'latitude', type: 'float', nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'longitude', type: 'float', nullable: true })
  longitude?: number;

  @Index('idx_organizations_location', { spatial: true })
  @Column({
    name: 'location',
    type: 'point',
    nullable: true,
  })
  location?: string;

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

  // --- Versicherungen ---
  @Field({ nullable: true })
  @Column({
    name: 'bvg_provider',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  bvgProvider?: string;

  @Field({ nullable: true })
  @Column({
    name: 'bvg_contact_phone',
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  bvgContactPhone?: string;

  @Field({ nullable: true })
  @Column({
    name: 'uvg_provider',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  uvgProvider?: string;

  @Field({ nullable: true })
  @Column({
    name: 'uvg_contact_phone',
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  uvgContactPhone?: string;

  @Field({ nullable: true })
  @Column({
    name: 'daily_sickness_provider',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  dailySicknessProvider?: string;

  @Field({ nullable: true })
  @Column({
    name: 'daily_sickness_contact_phone',
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  dailySicknessContactPhone?: string;
}
