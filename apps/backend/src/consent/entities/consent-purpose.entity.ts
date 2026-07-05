import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ConsentLegalBasis } from '../enums/consent-legal-basis.enum';
import { ConsentSubjectType } from '../enums/consent-subject-type.enum';

/**
 * Org-configurable catalogue of the things a school asks consent for
 * (photo use, medical data sharing, field trips, ...). Mirrors the
 * admission-stages "org defines its own list" pattern.
 */
@ObjectType()
@Entity('consent_purposes')
@Index('idx_consent_purposes_org', ['organizationId'])
@Index('UQ_consent_purpose_org_slug', ['organizationId', 'slug'], {
  unique: true,
})
export class ConsentPurpose extends AbstractEntity<ConsentPurpose> {
  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => String)
  @Column('text')
  slug: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string | null;

  /** Which subject kinds this purpose can be recorded for. */
  @Field(() => [ConsentSubjectType])
  @Column('enum', {
    enum: ConsentSubjectType,
    array: true,
    name: 'applies_to',
    default: '{}',
  })
  appliesTo: ConsentSubjectType[];

  @Field(() => ConsentLegalBasis)
  @Column('enum', {
    enum: ConsentLegalBasis,
    name: 'legal_basis',
    default: ConsentLegalBasis.CONSENT,
  })
  legalBasis: ConsentLegalBasis;

  /** A signed document (evidence) must be attached when granting. */
  @Field(() => Boolean)
  @Column('boolean', { name: 'requires_evidence', default: false })
  requiresEvidence: boolean;

  /** Must be decided during onboarding (surfaced as a required step). */
  @Field(() => Boolean)
  @Column('boolean', { name: 'is_mandatory', default: false })
  isMandatory: boolean;

  @Field(() => Int)
  @Column('int', { default: 0 })
  position: number;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
