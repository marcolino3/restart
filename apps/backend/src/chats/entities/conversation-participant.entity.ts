import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Conversation } from './conversation.entity';
import { ParticipantRole } from './participant-role.enum';

@ObjectType()
@Entity('conversation_participants')
// A membership appears at most once per conversation.
@Index(
  'UQ_participant_conversation_membership',
  ['conversationId', 'membershipId'],
  {
    unique: true,
  },
)
// Fast lookup of "which conversations does this membership belong to".
@Index('idx_participant_membership', ['membershipId'])
export class ConversationParticipant extends AbstractEntity<ConversationParticipant> {
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
  @ManyToOne(() => Conversation, (conversation) => conversation.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  // The participant is a Membership (org-scoped identity), consistent with how
  // the app models "a user in an org context" elsewhere.
  @Field(() => ID)
  @Column('uuid', { name: 'membership_id' })
  membershipId: string;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membership_id' })
  membership: Membership;

  @Field(() => ParticipantRole)
  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.MEMBER,
  })
  role: ParticipantRole;

  // Timestamp of the last message this participant has read. Everything created
  // after this counts as unread. Null means nothing read yet (all unread).
  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'last_read_at', nullable: true })
  lastReadAt?: Date | null;
}
