import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Reusable, org-scoped employee contract template. Body/header/footer are
 * HTML (Tiptap output) and may contain `{{placeholder}}` tokens that are
 * resolved against a concrete contract at generation time (see
 * ContractTemplatesService.preview / contract-placeholders.ts).
 */
@ObjectType()
@Entity('contract_templates')
@Index('idx_contract_templates_org', ['organizationId'])
export class ContractTemplate extends AbstractEntity<ContractTemplate> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Field(() => String)
  @Column('varchar', { length: 200 })
  name: string;

  @Field(() => String)
  @Column('text', { name: 'body_html' })
  bodyHtml: string;

  // Per-template letterhead rendered above the body on every page.
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'header_html', nullable: true })
  headerHtml?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'footer_html', nullable: true })
  footerHtml?: string | null;

  // Renders the organization logo in the document header when set.
  @Field(() => Boolean)
  @Column('boolean', { name: 'show_logo', default: true })
  showLogo: boolean;

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
