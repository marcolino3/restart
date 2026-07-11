import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';

/**
 * A conversation as shown in the sidebar list: the conversation itself plus the
 * caller-specific unread count and a preview of the latest message. Computed
 * per request for the current membership.
 */
@ObjectType()
export class ConversationListItem {
  @Field(() => Conversation)
  conversation: Conversation;

  @Field(() => Int)
  unreadCount: number;

  @Field(() => Message, { nullable: true })
  lastMessage?: Message | null;
}
