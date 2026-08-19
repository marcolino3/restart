import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
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

  @Field({ nullable: true })
  @Column({ name: 'short_code', type: 'varchar', length: 8, nullable: true })
  shortCode?: string;

  /**
   * Sponsorship, schoolType, careModel and activeLevels are four independent
   * dimensions — funding, pedagogy, care model and age bands. They used to be
   * squeezed into schoolType alone, which made none of them evaluable.
   *
   * All plain varchar validated against the TS enums in
   * packages/shared-schemas/src/organizations/organization-enums.ts, not a
   * PG enum — new values must not require a migration (CLAUDE.md 55P04
   * rule), mirrors organization_feature_toggles.feature_key.
   */
  @Field({ nullable: true })
  @Column({ name: 'sponsorship', type: 'varchar', length: 50, nullable: true })
  sponsorship?: string;

  @Field({ nullable: true })
  @Column({ name: 'school_type', type: 'varchar', length: 50, nullable: true })
  schoolType?: string;

  @Field({ nullable: true })
  @Column({ name: 'care_model', type: 'varchar', length: 50, nullable: true })
  careModel?: string;

  @Field({ nullable: true })
  @Column({
    name: 'legal_entity',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  legalEntity?: string;

  @Field({ nullable: true })
  @Column({
    name: 'language',
    type: 'varchar',
    length: 10,
    nullable: true,
    default: 'de-CH',
  })
  language?: string;

  @Field({ nullable: true })
  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl?: string;

  @Field({ nullable: true })
  @Column({
    name: 'billing_address_same_as_location',
    type: 'boolean',
    nullable: true,
    default: true,
  })
  billingAddressSameAsLocation?: boolean;

  @Field({ nullable: true })
  @Column({
    name: 'billing_address_extra',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  billingAddressExtra?: string;

  /** Structured like ContactPerson: salutation + title + first/last name. */
  @Field({ nullable: true })
  @Column({
    name: 'contact_salutation',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  contactSalutation?: string;

  @Field({ nullable: true })
  @Column({
    name: 'contact_title',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  contactTitle?: string;

  @Field({ nullable: true })
  @Column({
    name: 'contact_first_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  contactFirstName?: string;

  @Field({ nullable: true })
  @Column({
    name: 'contact_last_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  contactLastName?: string;

  @Field({ nullable: true })
  @Column({
    name: 'contact_role',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  contactRole?: string;

  @Field({ nullable: true })
  @Column({
    name: 'contact_email',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  contactEmail?: string;

  @Field({ nullable: true })
  @Column({
    name: 'contact_phone',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  contactPhone?: string;

  @Field({ nullable: true })
  @Column({
    name: 'billing_email',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  billingEmail?: string;

  @Field({ nullable: true })
  @Column({
    name: 'parent_mail_sender_email',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  parentMailSenderEmail?: string;

  @Field({ nullable: true })
  @Column({
    name: 'current_school_year',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  currentSchoolYear?: string;

  @Field(() => [String], { nullable: true })
  @Column({ name: 'active_levels', type: 'text', array: true, nullable: true })
  activeLevels?: string[];

  /**
   * Plain varchar, same reasoning as schoolType above.
   */
  @Field({ nullable: true })
  @Column({
    name: 'plan',
    type: 'varchar',
    length: 30,
    nullable: true,
    default: 'STARTER',
  })
  plan?: string;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'user_license_limit', type: 'int', nullable: true })
  userLicenseLimit?: number;

  @Field({ nullable: true })
  @Column({ name: 'contract_ends_at', type: 'date', nullable: true })
  contractEndsAt?: string;

  @Field({ nullable: true })
  @Column({
    name: 'billing_interval',
    type: 'varchar',
    length: 20,
    nullable: true,
    default: 'YEARLY',
  })
  billingInterval?: string;

  @Field(() => Float, { nullable: true })
  @Column({
    name: 'billing_amount_chf',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  billingAmountChf?: number;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'storage_limit_gb', type: 'int', nullable: true })
  storageLimitGb?: number;

  /**
   * Plain varchar, same reasoning as schoolType above. `isActive`
   * (AbstractEntity) stays the source of truth for login/query gating and is
   * kept in sync from this field; this field carries the richer Trial/
   * Suspended distinction the UI needs.
   */
  @Field({ nullable: true })
  @Column({
    name: 'lifecycle_status',
    type: 'varchar',
    length: 20,
    nullable: true,
    default: 'ACTIVE',
  })
  lifecycleStatus?: string;

  @Field({ nullable: true })
  @Column({ name: 'trial_ends_at', type: 'date', nullable: true })
  trialEndsAt?: string;

  @Field({ nullable: true })
  @Column({ name: 'suspended_at', type: 'timestamp', nullable: true })
  suspendedAt?: Date;

  @Field({ nullable: true })
  @Column({
    name: 'suspended_reason',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  suspendedReason?: string;

  @Field({ nullable: true })
  @Column({ name: 'suspended_by_id', type: 'uuid', nullable: true })
  suspendedById?: string;

  @Field()
  @Column({
    name: 'timezone',
    type: 'varchar',
    length: 100,
    default: 'Europe/Berlin',
  })
  timezone!: string;

  /**
   * Day the school year starts, as month + day (1 August by default).
   *
   * There is deliberately no SchoolYear entity. A school year is derived from
   * this cut-off, so nobody has to create one every August and classes stay
   * timeless — history lives in the validity ranges on assignments and
   * enrolments instead. Anything asking "which year is this date in" resolves
   * it against these two columns.
   *
   * Capped at day 28 by a CHECK constraint so the cut-off exists in every
   * month, February included.
   */
  @Field(() => Int)
  @Column({
    name: 'school_year_start_month',
    type: 'smallint',
    default: 8,
  })
  schoolYearStartMonth!: number;

  @Field(() => Int)
  @Column({
    name: 'school_year_start_day',
    type: 'smallint',
    default: 1,
  })
  schoolYearStartDay!: number;

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
