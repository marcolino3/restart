import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, LessThan, Repository } from 'typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Message } from './entities/message.entity';
import { ConversationType } from './entities/conversation-type.enum';
import { ParticipantRole } from './entities/participant-role.enum';
import { CreateConversationInput } from './dto/create-conversation.input';
import { ConversationListItem } from './dto/conversation-list-item.output';
import { MessagesPageArgs } from './dto/messages-page.args';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationsRepo: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly participantsRepo: Repository<ConversationParticipant>,
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Conversations the given membership participates in, most-recently-active
   * first, each annotated with the caller's unread count and last message.
   * Everything is scoped to the org — a participant row only exists within one
   * org, so filtering participants by (orgId, membershipId) is the tenant gate.
   */
  async listForMembership(
    orgId: string,
    membershipId: string,
  ): Promise<ConversationListItem[]> {
    const memberships = await this.participantsRepo.find({
      where: { organizationId: orgId, membershipId },
      relations: {
        conversation: {
          participants: { membership: true },
          team: true,
        },
      },
    });

    const items = await Promise.all(
      memberships.map(async (participant) => {
        const conversation = participant.conversation;
        const [lastMessage, unreadCount] = await Promise.all([
          this.messagesRepo.findOne({
            where: {
              organizationId: orgId,
              conversationId: conversation.id,
            },
            order: { createdAt: 'DESC' },
            relations: { sender: true },
          }),
          this.countUnread(orgId, conversation.id, participant.lastReadAt),
        ]);
        return { conversation, lastMessage, unreadCount };
      }),
    );

    // Most recent activity first; conversations with no messages sort by
    // creation via lastMessageAt fallback.
    return items.sort((a, b) => {
      const ta =
        a.conversation.lastMessageAt?.getTime() ??
        a.conversation.createdAt.getTime();
      const tb =
        b.conversation.lastMessageAt?.getTime() ??
        b.conversation.createdAt.getTime();
      return tb - ta;
    });
  }

  private async countUnread(
    orgId: string,
    conversationId: string,
    lastReadAt: Date | null | undefined,
  ): Promise<number> {
    const qb = this.messagesRepo
      .createQueryBuilder('m')
      .where('m.organization_id = :orgId', { orgId })
      .andWhere('m.conversation_id = :conversationId', { conversationId });
    if (lastReadAt) {
      qb.andWhere('m.created_at > :lastReadAt', { lastReadAt });
    }
    return qb.getCount();
  }

  /** Asserts the membership participates in the conversation (org-scoped). */
  async assertParticipant(
    orgId: string,
    membershipId: string,
    conversationId: string,
  ): Promise<ConversationParticipant> {
    const participant = await this.participantsRepo.findOne({
      where: {
        organizationId: orgId,
        conversationId,
        membershipId,
      },
    });
    if (!participant) {
      throw new ForbiddenException('Not a participant of this conversation');
    }
    return participant;
  }

  async isParticipant(
    orgId: string,
    membershipId: string,
    conversationId: string,
  ): Promise<boolean> {
    const count = await this.participantsRepo.count({
      where: { organizationId: orgId, conversationId, membershipId },
    });
    return count > 0;
  }

  async findConversation(
    orgId: string,
    conversationId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationsRepo.findOne({
      where: { organizationId: orgId, id: conversationId },
      relations: { participants: { membership: true }, team: true },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  async getMessages(
    orgId: string,
    membershipId: string,
    args: MessagesPageArgs,
  ): Promise<Message[]> {
    await this.assertParticipant(orgId, membershipId, args.conversationId);

    let beforeCreatedAt: Date | undefined;
    if (args.before) {
      const cursor = await this.messagesRepo.findOne({
        where: { organizationId: orgId, id: args.before },
        select: { createdAt: true },
      });
      beforeCreatedAt = cursor?.createdAt;
    }

    const messages = await this.messagesRepo.find({
      where: {
        organizationId: orgId,
        conversationId: args.conversationId,
        ...(beforeCreatedAt ? { createdAt: LessThan(beforeCreatedAt) } : {}),
      },
      order: { createdAt: 'DESC' },
      take: args.limit,
      relations: { sender: true, attachments: true },
    });
    // Return chronological (oldest first) for rendering.
    return messages.reverse();
  }

  /**
   * Creates a conversation. DIRECT conversations are deduplicated: if a 1:1
   * between the two memberships already exists it is returned instead of a
   * duplicate. The caller is always a participant.
   */
  async createConversation(
    orgId: string,
    callerMembershipId: string,
    input: CreateConversationInput,
  ): Promise<Conversation> {
    const otherIds = (input.participantMembershipIds ?? []).filter(
      (id) => id !== callerMembershipId,
    );

    if (input.type === ConversationType.DIRECT) {
      if (otherIds.length !== 1) {
        throw new BadRequestException(
          'A direct conversation needs exactly one other participant',
        );
      }
      const existing = await this.findExistingDirect(
        orgId,
        callerMembershipId,
        otherIds[0],
      );
      if (existing) return existing;
    }

    if (input.type === ConversationType.GROUP && !input.name?.trim()) {
      throw new BadRequestException('A group conversation needs a name');
    }

    if (input.type === ConversationType.TEAM && !input.teamId) {
      throw new BadRequestException('A team conversation needs a teamId');
    }

    await this.assertMembershipsInOrg(orgId, otherIds);

    return this.dataSource.transaction(async (manager) => {
      const conversation = manager.create(Conversation, {
        organizationId: orgId,
        type: input.type,
        name: input.type === ConversationType.GROUP ? input.name!.trim() : null,
        teamId: input.type === ConversationType.TEAM ? input.teamId : null,
      });
      await manager.save(conversation);

      const memberIds = [callerMembershipId, ...otherIds];
      const participants = memberIds.map((membershipId) =>
        manager.create(ConversationParticipant, {
          organizationId: orgId,
          conversationId: conversation.id,
          membershipId,
          // The group creator is admin; everyone else is a member.
          role:
            input.type === ConversationType.GROUP &&
            membershipId === callerMembershipId
              ? ParticipantRole.ADMIN
              : ParticipantRole.MEMBER,
        }),
      );
      await manager.save(participants);

      return manager.findOneOrFail(Conversation, {
        where: { id: conversation.id },
        relations: { participants: { membership: true }, team: true },
      });
    });
  }

  private async findExistingDirect(
    orgId: string,
    a: string,
    b: string,
  ): Promise<Conversation | null> {
    // A direct conversation containing exactly both memberships and nobody
    // else. Find candidate conversations of both, intersect, verify size 2.
    const rows = await this.participantsRepo.find({
      where: {
        organizationId: orgId,
        membershipId: In([a, b]),
        conversation: { type: ConversationType.DIRECT },
      },
      relations: { conversation: true },
    });
    const byConversation = new Map<string, Set<string>>();
    for (const row of rows) {
      const set = byConversation.get(row.conversationId) ?? new Set();
      set.add(row.membershipId);
      byConversation.set(row.conversationId, set);
    }
    for (const [conversationId, members] of byConversation) {
      if (members.has(a) && members.has(b)) {
        const total = await this.participantsRepo.count({
          where: { organizationId: orgId, conversationId },
        });
        if (total === 2) {
          return this.conversationsRepo.findOne({
            where: { organizationId: orgId, id: conversationId },
            relations: { participants: { membership: true }, team: true },
          });
        }
      }
    }
    return null;
  }

  private async assertMembershipsInOrg(
    orgId: string,
    membershipIds: string[],
  ): Promise<void> {
    if (membershipIds.length === 0) return;
    const count = await this.membershipsRepo.count({
      where: { organizationId: orgId, id: In(membershipIds) },
    });
    if (count !== new Set(membershipIds).size) {
      throw new BadRequestException(
        'One or more participants are not members of this organization',
      );
    }
  }

  /**
   * Persists a message, bumps the conversation's lastMessageAt and returns the
   * message with its sender loaded. Publishing to PubSub is the resolver's job
   * so the service stays transport-agnostic.
   */
  async sendMessage(
    orgId: string,
    senderMembershipId: string,
    conversationId: string,
    body: string,
  ): Promise<Message> {
    await this.assertParticipant(orgId, senderMembershipId, conversationId);

    return this.dataSource.transaction(async (manager) => {
      const message = manager.create(Message, {
        organizationId: orgId,
        conversationId,
        senderMembershipId,
        body: body.trim(),
      });
      await manager.save(message);

      await manager.update(
        Conversation,
        { id: conversationId, organizationId: orgId },
        { lastMessageAt: message.createdAt },
      );

      // The sender has, by definition, read their own message.
      await manager.update(
        ConversationParticipant,
        {
          conversationId,
          organizationId: orgId,
          membershipId: senderMembershipId,
        },
        { lastReadAt: message.createdAt },
      );

      return manager.findOneOrFail(Message, {
        where: { id: message.id },
        relations: { sender: true, attachments: true },
      });
    });
  }

  /** Marks the conversation read up to now for the given membership. */
  async markRead(
    orgId: string,
    membershipId: string,
    conversationId: string,
  ): Promise<ConversationParticipant> {
    const participant = await this.assertParticipant(
      orgId,
      membershipId,
      conversationId,
    );
    participant.lastReadAt = new Date();
    return this.participantsRepo.save(participant);
  }

  /** Membership ids of every participant of a conversation (org-scoped). */
  async participantMembershipIds(
    orgId: string,
    conversationId: string,
  ): Promise<string[]> {
    const rows = await this.participantsRepo.find({
      where: { organizationId: orgId, conversationId },
      select: { membershipId: true },
    });
    return rows.map((r) => r.membershipId);
  }
}
