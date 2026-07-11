import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { MessageAttachment } from './message-attachment.entity';

@ObjectType()
@Entity('messages')
// Primary access pattern: load a conversation's messages newest-first.
@Index('idx_messages_conversation_created', ['conversationId', 'createdAt'])
@Index('idx_messages_org', ['organizationId'])
export class Message extends AbstractEntity<Message> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'conversation_id' })
  conversationId: string;

  @Field(() => Conversation, { nullable: true })
  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  // Author. Nullable + SET NULL so removing a membership keeps the message
  // history intact (rendered as "former member") rather than cascade-deleting.
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'sender_membership_id', nullable: true })
  senderMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender_membership_id' })
  sender?: Membership | null;

  @Field(() => String)
  @Column('text')
  body: string;

  // Set once the message has been edited; drives an "edited" marker in the UI.
  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'edited_at', nullable: true })
  editedAt?: Date | null;

  @Field(() => [MessageAttachment], { nullable: true })
  @OneToMany(() => MessageAttachment, (attachment) => attachment.message, {
    cascade: true,
  })
  attachments?: MessageAttachment[];
}
