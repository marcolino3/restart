import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Message } from './message.entity';

/**
 * A file attachment on a chat message. Metadata lives here; the binary is
 * stored in object storage under an org-scoped key derived from `fileId` and
 * reachable only via the authenticated, org-scoped chat attachment route
 * (multi-tenant isolation by construction — mirrors AdmissionDocument).
 */
@ObjectType()
@Entity('message_attachments')
@Index('idx_message_attachments_message', ['messageId'])
@Index('idx_message_attachments_org', ['organizationId'])
export class MessageAttachment extends AbstractEntity<MessageAttachment> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'message_id' })
  messageId: string;

  @Field(() => Message, { nullable: true })
  @ManyToOne(() => Message, (message) => message.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message?: Message;

  /** Storage reference used to build the object key — NOT the primary key. */
  @Field(() => ID)
  @Column('uuid', { name: 'file_id' })
  fileId: string;

  @Field(() => String)
  @Column('text', { name: 'original_name' })
  originalName: string;

  @Field(() => String)
  @Column('text', { name: 'mime_type' })
  mimeType: string;

  @Field(() => Int)
  @Column('int', { name: 'size_bytes' })
  sizeBytes: number;
}
