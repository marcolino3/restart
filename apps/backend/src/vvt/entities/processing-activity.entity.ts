import { AbstractEntity } from '@/database/abstract.entity';
import { ConsentLegalBasis } from '@/consent/enums/consent-legal-basis.enum';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * A record of processing activity (Verarbeitungstätigkeit, DSGVO Art. 30 /
 * revDSG). Org-configurable documentation — no personal data itself.
 */
@ObjectType()
@Entity('processing_activities')
@Index('idx_processing_activities_org', ['organizationId'])
export class ProcessingActivity extends AbstractEntity<ProcessingActivity> {
  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  purpose?: string | null;

  @Field(() => ConsentLegalBasis)
  @Column('enum', {
    enum: ConsentLegalBasis,
    name: 'legal_basis',
    default: ConsentLegalBasis.CONSENT,
  })
  legalBasis: ConsentLegalBasis;

  /** What categories of data are processed. */
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'data_categories', nullable: true })
  dataCategories?: string | null;

  /** Whose data (e.g. students, staff, applicants). */
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'data_subjects', nullable: true })
  dataSubjects?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  recipients?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'retention_note', nullable: true })
  retentionNote?: string | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
