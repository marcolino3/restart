import { Address } from '@/addresses/entities/address.entity';
import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Family } from '@/school-management/families/entities/family.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { RelationshipType } from '../enums/relationship-type.enum';
import { Salutation } from '../enums/salutation.enum';
import { IContactPerson } from '../interfaces/contact-person.interface';

@ObjectType()
@Entity('contact_persons')
@Index('idx_contact_persons_org', ['organizationId'])
@Index('idx_contact_persons_email', ['organizationId', 'email'])
@Index('idx_contact_persons_family', ['familyId'])
export class ContactPerson
  extends AbstractEntity<ContactPerson>
  implements IContactPerson
{
  @Field(() => Salutation, { nullable: true })
  @Column('enum', { enum: Salutation, nullable: true })
  salutation?: Salutation | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  title?: string | null;

  @Field(() => String)
  @Column('text', { name: 'first_name' })
  firstName: string;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'middle_name', nullable: true })
  middleName?: string | null;

  @Field(() => String)
  @Column('text', { name: 'last_name' })
  lastName: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  mobile?: string | null;

  @Field(() => String, { nullable: true })
  @Column('date', { name: 'date_of_birth', nullable: true })
  dateOfBirth?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', {
    name: 'social_security_number',
    nullable: true,
  })
  socialSecurityNumber?: string | null;

  @Field(() => [String])
  @Column('text', { array: true, nullable: true })
  nationalities: string[];

  @Field(() => [String])
  @Column('text', {
    name: 'preferred_languages',
    array: true,
    nullable: true,
  })
  preferredLanguages: string[];

  @Field(() => [RelationshipType])
  @Column('enum', {
    enum: RelationshipType,
    array: true,
    nullable: true,
  })
  roles: RelationshipType[];

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  occupation?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  notes?: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'address_id', nullable: true })
  addressId?: string | null;

  @Field(() => Address, { nullable: true })
  @ManyToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'address_id' })
  address?: Address | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'user_id', nullable: true })
  userId?: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'family_id', nullable: true })
  familyId?: string | null;

  @Field(() => Family, { nullable: true })
  @ManyToOne(() => Family, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'family_id' })
  family?: Family | null;

  /**
   * Ordering within a family. The lowest sortOrder is treated as the primary
   * contact (shown on the admission "Angaben" card). Reorder to change it.
   */
  @Field(() => Int)
  @Column('integer', { name: 'sort_order', default: 0 })
  sortOrder: number;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
