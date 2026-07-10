import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ConversationType } from './conversation-type.enum';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';

@ObjectType()
@Entity('conversations')
@Index('idx_conversations_org', ['organizationId'])
// A TEAM conversation is unique per team within an org — at most one chat room
// per team. DIRECT/GROUP have no such constraint (teamId is null).
@Index('UQ_conversation_org_team', ['organizationId', 'teamId'], {
  unique: true,
  where: '"team_id" IS NOT NULL',
})
export class Conversation extends AbstractEntity<Conversation> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => ConversationType)
  @Column({ type: 'enum', enum: ConversationType })
  type: ConversationType;

  // Display name. Required for GROUP; for DIRECT/TEAM the frontend derives the
  // title from the other participant / the team, so this stays null there.
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  name?: string | null;

  // Only set for TEAM conversations. onDelete SET NULL so removing a team does
  // not cascade-delete its chat history; the conversation is simply detached.
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'team_id', nullable: true })
  teamId?: string | null;

  @Field(() => Team, { nullable: true })
  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'team_id' })
  team?: Team | null;

  // Denormalised timestamp of the most recent message, kept in sync on send.
  // Drives the "most recent first" ordering of the conversation list without a
  // correlated subquery on every load.
  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'last_message_at', nullable: true })
  lastMessageAt?: Date | null;

  @Field(() => [ConversationParticipant], { nullable: true })
  @OneToMany(
    () => ConversationParticipant,
    (participant) => participant.conversation,
  )
  participants?: ConversationParticipant[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages?: Message[];
}
