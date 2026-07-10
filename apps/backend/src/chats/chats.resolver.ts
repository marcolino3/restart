import { Inject } from '@nestjs/common';
import {
  Args,
  ID,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { PostgresPubSub } from 'graphql-pg-subscriptions';
import { ChatsService } from './chats.service';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { ConversationListItem } from './dto/conversation-list-item.output';
import { CreateConversationInput } from './dto/create-conversation.input';
import { SendMessageInput } from './dto/send-message.input';
import { MessagesPageArgs } from './dto/messages-page.args';
import { PUB_SUB } from './pubsub/pubsub.provider';

/** Topic for message events of one conversation. */
const messageTopic = (conversationId: string) =>
  `messageAdded.${conversationId}`;

/** Shape a subscription context carries after onConnect (see app.module). */
interface WsContext {
  orgId?: string;
  membershipId?: string;
}

@Resolver(() => Conversation)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ChatsResolver {
  constructor(
    private readonly chatsService: ChatsService,
    @Inject(PUB_SUB) private readonly pubSub: PostgresPubSub,
  ) {}

  private assertMembership(user: TokenPayload): string {
    if (!user?.membershipId) {
      throw new Error('No active membership');
    }
    return user.membershipId;
  }

  // The caller's own membership id in the active org. The web/mobile clients
  // need it to tell "my" messages apart and to derive direct-chat titles.
  @Query(() => ID, { name: 'myChatMembershipId' })
  @Permissions('CHAT_READ')
  myChatMembershipId(@CurrentUser() user: TokenPayload): string {
    return this.assertMembership(user);
  }

  @Query(() => [ConversationListItem], { name: 'myConversations' })
  @Permissions('CHAT_READ')
  myConversations(
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
  ): Promise<ConversationListItem[]> {
    return this.chatsService.listForMembership(
      orgId,
      this.assertMembership(user),
    );
  }

  @Query(() => [Membership], { name: 'chatContacts' })
  @Permissions('CHAT_READ')
  chatContacts(
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
  ): Promise<Membership[]> {
    return this.chatsService.listContacts(orgId, this.assertMembership(user));
  }

  @Query(() => Conversation, { name: 'conversation' })
  @Permissions('CHAT_READ')
  async conversation(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
  ): Promise<Conversation> {
    await this.chatsService.assertParticipant(
      orgId,
      this.assertMembership(user),
      id,
    );
    return this.chatsService.findConversation(orgId, id);
  }

  @Query(() => [Message], { name: 'conversationMessages' })
  @Permissions('CHAT_READ')
  conversationMessages(
    @Args() args: MessagesPageArgs,
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
  ): Promise<Message[]> {
    return this.chatsService.getMessages(
      orgId,
      this.assertMembership(user),
      args,
    );
  }

  @Mutation(() => Conversation)
  @Permissions('CHAT_WRITE')
  createConversation(
    @Args('input') input: CreateConversationInput,
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
  ): Promise<Conversation> {
    return this.chatsService.createConversation(
      orgId,
      this.assertMembership(user),
      input,
    );
  }

  @Mutation(() => Message)
  @Permissions('CHAT_WRITE')
  async sendMessage(
    @Args('input') input: SendMessageInput,
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
  ): Promise<Message> {
    const message = await this.chatsService.sendMessage(
      orgId,
      this.assertMembership(user),
      input.conversationId,
      input.body,
    );
    await this.pubSub.publish(messageTopic(input.conversationId), {
      messageAdded: message,
    });
    return message;
  }

  @Mutation(() => ConversationParticipant)
  @Permissions('CHAT_READ')
  markConversationRead(
    @Args('conversationId', { type: () => ID }) conversationId: string,
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
  ): Promise<ConversationParticipant> {
    return this.chatsService.markRead(
      orgId,
      this.assertMembership(user),
      conversationId,
    );
  }

  /**
   * Streams new messages of a conversation. The filter is defence-in-depth:
   * the topic is already per-conversation, but we additionally verify the
   * subscriber is a participant in the current org before delivering — so a
   * client cannot subscribe to a conversation it does not belong to.
   */
  @Subscription(() => Message, {
    name: 'messageAdded',
    filter: async function (
      this: ChatsResolver,
      payload: { messageAdded: Message },
      variables: { conversationId: string },
      context: WsContext,
    ) {
      if (payload.messageAdded.conversationId !== variables.conversationId) {
        return false;
      }
      if (!context.orgId || !context.membershipId) return false;
      return this.chatsService.isParticipant(
        context.orgId,
        context.membershipId,
        variables.conversationId,
      );
    },
    resolve: (payload: { messageAdded: Message }) => payload.messageAdded,
  })
  messageAdded(
    @Args('conversationId', { type: () => ID }) conversationId: string,
  ) {
    return this.pubSub.asyncIterableIterator<Message>(
      messageTopic(conversationId),
    );
  }
}
