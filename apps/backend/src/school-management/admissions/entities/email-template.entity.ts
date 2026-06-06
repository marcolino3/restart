import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EmailTemplateCategory } from '../enums/email-template-category.enum';

/**
 * Reusable, org-scoped email template. Body is HTML (Tiptap output) and may
 * contain `{{placeholder}}` tokens that are resolved against an application at
 * send time (see AdmissionEmailsService.preview).
 */
@ObjectType()
@Entity('email_templates')
@Index('idx_email_templates_org', ['organizationId'])
@Index('idx_email_templates_org_category', ['organizationId', 'category'])
export class EmailTemplate extends AbstractEntity<EmailTemplate> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Field(() => String)
  @Column('varchar', { length: 200 })
  name: string;

  @Field(() => EmailTemplateCategory)
  @Column('enum', {
    enum: EmailTemplateCategory,
    default: EmailTemplateCategory.ADMISSION,
  })
  category: EmailTemplateCategory;

  @Field(() => String)
  @Column('varchar', { length: 300 })
  subject: string;

  @Field(() => String)
  @Column('text', { name: 'body_html' })
  bodyHtml: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'created_by_membership_id', nullable: true })
  createdByMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_membership_id' })
  createdByMembership?: Membership | null;
}
