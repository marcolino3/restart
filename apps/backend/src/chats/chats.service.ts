import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, LessThan, Repository } from 'typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { TeamAccessService } from '@/employee-management/teams/team-access.service';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Message } from './entities/message.entity';
import { MessageAttachment } from './entities/message-attachment.entity';
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
    private readonly teamAccess: TeamAccessService,
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
    // 1) DIRECT/GROUP (and any TEAM chats I already have a read-state row for)
    // come from my participant rows.
    const participantRows = await this.participantsRepo.find({
      where: { organizationId: orgId, membershipId },
      relations: {
        conversation: {
          participants: { membership: { user: true } },
          team: true,
        },
      },
    });
    const byConvId = new Map<
      string,
      { conversation: Conversation; lastReadAt: Date | null | undefined }
    >();
    for (const p of participantRows) {
      byConvId.set(p.conversation.id, {
        conversation: p.conversation,
        lastReadAt: p.lastReadAt,
      });
    }

    // 2) TEAM chats are resolved live: include every TEAM conversation whose
    // team roster currently contains me, even without a participant row. This
    // is what makes team membership changes reflect immediately.
    const teamConversations = await this.conversationsRepo.find({
      where: { organizationId: orgId, type: ConversationType.TEAM },
      relations: { participants: { membership: { user: true } }, team: true },
    });
    for (const conv of teamConversations) {
      if (byConvId.has(conv.id) || !conv.teamId) continue;
      const roster = await this.teamAccess.getDirectMembershipIdsForTeam(
        orgId,
        conv.teamId,
      );
      if (roster.includes(membershipId)) {
        byConvId.set(conv.id, { conversation: conv, lastReadAt: null });
      }
    }

    const items = await Promise.all(
      Array.from(byConvId.values()).map(
        async ({ conversation, lastReadAt }) => {
          const [lastMessage, unreadCount] = await Promise.all([
            this.messagesRepo.findOne({
              where: {
                organizationId: orgId,
                conversationId: conversation.id,
              },
              order: { createdAt: 'DESC' },
              relations: { sender: { user: true } },
            }),
            this.countUnread(orgId, conversation.id, lastReadAt),
          ]);
          return { conversation, lastMessage, unreadCount };
        },
      ),
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
    // Use entity property names (camelCase); TypeORM maps them to the actual
    // columns. The AbstractEntity timestamp column is "createdAt", not
    // "created_at" — raw snake_case here would fail at the DB.
    const qb = this.messagesRepo
      .createQueryBuilder('m')
      .where('m.organizationId = :orgId', { orgId })
      .andWhere('m.conversationId = :conversationId', { conversationId });
    if (lastReadAt) {
      qb.andWhere('m.createdAt > :lastReadAt', { lastReadAt });
    }
    return qb.getCount();
  }

  /**
   * Whether a membership may access a conversation. For DIRECT/GROUP this is a
   * stored conversation_participants row. For TEAM the roster is resolved LIVE
   * from the team's direct members — so removing someone from the team removes
   * their chat access immediately (no participant-row sync to fall behind).
   */
  async isParticipant(
    orgId: string,
    membershipId: string,
    conversationId: string,
  ): Promise<boolean> {
    const conversation = await this.conversationsRepo.findOne({
      where: { organizationId: orgId, id: conversationId },
      select: { id: true, type: true, teamId: true },
    });
    if (!conversation) return false;

    if (conversation.type === ConversationType.TEAM && conversation.teamId) {
      const roster = await this.teamAccess.getDirectMembershipIdsForTeam(
        orgId,
        conversation.teamId,
      );
      return roster.includes(membershipId);
    }

    const count = await this.participantsRepo.count({
      where: { organizationId: orgId, conversationId, membershipId },
    });
    return count > 0;
  }

  /**
   * Asserts membership access and returns a ConversationParticipant row usable
   * for read-state (lastReadAt). For TEAM chats the row is lazily created on
   * first access since we don't materialize the roster; it is read-state only,
   * never the authorization gate (that's isParticipant above).
   */
  async assertParticipant(
    orgId: string,
    membershipId: string,
    conversationId: string,
  ): Promise<ConversationParticipant> {
    const allowed = await this.isParticipant(
      orgId,
      membershipId,
      conversationId,
    );
    if (!allowed) {
      throw new ForbiddenException('Not a participant of this conversation');
    }
    let participant = await this.participantsRepo.findOne({
      where: { organizationId: orgId, conversationId, membershipId },
    });
    if (!participant) {
      // TEAM member with no read-state row yet — create one lazily.
      participant = await this.participantsRepo.save(
        this.participantsRepo.create({
          organizationId: orgId,
          conversationId,
          membershipId,
        }),
      );
    }
    return participant;
  }

  /**
   * Org members the caller can start a chat with — everyone in the active org
   * except the caller. Gated by CHAT_READ (not EMPLOYEE_READ), so a chat user
   * without HR access can still pick recipients. Returns Memberships with the
   * user relation for name/avatar rendering.
   */
  async listContacts(
    orgId: string,
    callerMembershipId: string,
  ): Promise<Membership[]> {
    const memberships = await this.membershipsRepo.find({
      where: { organizationId: orgId, isActive: true },
      relations: { user: true },
    });
    return memberships.filter((m) => m.id !== callerMembershipId);
  }

  async findConversation(
    orgId: string,
    conversationId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationsRepo.findOne({
      where: { organizationId: orgId, id: conversationId },
      relations: { participants: { membership: { user: true } }, team: true },
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
      relations: { sender: { user: true }, attachments: true },
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

    if (input.type === ConversationType.TEAM) {
      if (!input.teamId) {
        throw new BadRequestException('A team conversation needs a teamId');
      }
      // At most one chat per team — return the existing one if present.
      const existing = await this.conversationsRepo.findOne({
        where: {
          organizationId: orgId,
          type: ConversationType.TEAM,
          teamId: input.teamId,
        },
        relations: { participants: { membership: { user: true } }, team: true },
      });
      if (existing) return existing;
      // The creator must actually belong to the team.
      const roster = await this.teamAccess.getDirectMembershipIdsForTeam(
        orgId,
        input.teamId,
      );
      if (!roster.includes(callerMembershipId)) {
        throw new ForbiddenException('You are not a member of this team');
      }
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

      // TEAM chats do NOT materialize participant rows — the roster is derived
      // live from team membership (read-state rows are created lazily on first
      // access). DIRECT/GROUP store their explicit participant list.
      if (input.type !== ConversationType.TEAM) {
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
      }

      return manager.findOneOrFail(Conversation, {
        where: { id: conversation.id },
        relations: { participants: { membership: { user: true } }, team: true },
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
            relations: {
              participants: { membership: { user: true } },
              team: true,
            },
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
    attachment?: {
      fileId: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
    },
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

      if (attachment) {
        const att = manager.create(MessageAttachment, {
          organizationId: orgId,
          messageId: message.id,
          fileId: attachment.fileId,
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
        });
        await manager.save(att);
      }

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
        relations: { sender: { user: true }, attachments: true },
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

  /**
   * Edits the body of a message. Only the original sender may edit it (within
   * their org). Sets editedAt and returns the message with relations loaded.
   */
  async editMessage(
    orgId: string,
    membershipId: string,
    messageId: string,
    body: string,
  ): Promise<Message> {
    const message = await this.messagesRepo.findOne({
      where: { id: messageId, organizationId: orgId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderMembershipId !== membershipId) {
      throw new ForbiddenException('You can only edit your own messages');
    }
    message.body = body.trim();
    message.editedAt = new Date();
    await this.messagesRepo.save(message);
    return this.messagesRepo.findOneOrFail({
      where: { id: messageId },
      relations: { sender: { user: true }, attachments: true },
    });
  }

  /**
   * Deletes a message. Only the original sender may delete it (within their
   * org). Returns the conversationId so callers can publish a delete event.
   */
  async deleteMessage(
    orgId: string,
    membershipId: string,
    messageId: string,
  ): Promise<{ conversationId: string }> {
    const message = await this.messagesRepo.findOne({
      where: { id: messageId, organizationId: orgId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderMembershipId !== membershipId) {
      throw new ForbiddenException('You can only delete your own messages');
    }
    const conversationId = message.conversationId;
    await this.messagesRepo.remove(message);
    return { conversationId };
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
