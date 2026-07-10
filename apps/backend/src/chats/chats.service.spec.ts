import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatsService } from './chats.service';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Message } from './entities/message.entity';
import { ConversationType } from './entities/conversation-type.enum';
import { Membership } from '@/memberships/entities/membership.entity';

const ORG = 'org-1';
const ME = 'membership-me';
const OTHER = 'membership-other';

describe('ChatsService', () => {
  // Repos are mocked as bags of jest.fn(); cast to the repo type only at the
  // provider boundary so the test body keeps full jest.Mock typing.
  let service: ChatsService;
  let conversationsRepo: Record<string, jest.Mock>;
  let participantsRepo: Record<string, jest.Mock>;
  let messagesRepo: Record<string, jest.Mock>;
  let membershipsRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    conversationsRepo = { findOne: jest.fn() };
    participantsRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn((p: unknown) => Promise.resolve(p)),
    };
    messagesRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    membershipsRepo = { count: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: conversationsRepo,
        },
        {
          provide: getRepositoryToken(ConversationParticipant),
          useValue: participantsRepo,
        },
        { provide: getRepositoryToken(Message), useValue: messagesRepo },
        { provide: getRepositoryToken(Membership), useValue: membershipsRepo },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
      ],
    }).compile();

    service = module.get(ChatsService);
  });

  describe('assertParticipant (multi-tenant gate)', () => {
    it('throws Forbidden when the membership is not a participant', async () => {
      participantsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assertParticipant(ORG, ME, 'conv-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('scopes the participant lookup to org, conversation and membership', async () => {
      participantsRepo.findOne.mockResolvedValue({});

      await service.assertParticipant(ORG, ME, 'conv-1');

      expect(participantsRepo.findOne).toHaveBeenCalledWith({
        where: {
          organizationId: ORG,
          conversationId: 'conv-1',
          membershipId: ME,
        },
      });
    });
  });

  describe('getMessages', () => {
    it('refuses to load messages of a conversation the caller is not in', async () => {
      participantsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getMessages(ORG, ME, {
          conversationId: 'conv-x',
          limit: 30,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(messagesRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('createConversation', () => {
    it('rejects a DIRECT conversation without exactly one other participant', async () => {
      await expect(
        service.createConversation(ORG, ME, {
          type: ConversationType.DIRECT,
          participantMembershipIds: [],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a GROUP conversation without a name', async () => {
      membershipsRepo.count.mockResolvedValue(1);
      await expect(
        service.createConversation(ORG, ME, {
          type: ConversationType.GROUP,
          participantMembershipIds: [OTHER],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a TEAM conversation without a teamId', async () => {
      await expect(
        service.createConversation(ORG, ME, {
          type: ConversationType.TEAM,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns the existing DIRECT conversation instead of creating a duplicate', async () => {
      // Both memberships already share one direct conversation.
      participantsRepo.find.mockResolvedValue([
        { conversationId: 'conv-1', membershipId: ME },
        { conversationId: 'conv-1', membershipId: OTHER },
      ] as ConversationParticipant[]);
      participantsRepo.count.mockResolvedValue(2);
      const existing = { id: 'conv-1' } as Conversation;
      conversationsRepo.findOne.mockResolvedValue(existing);

      const result = await service.createConversation(ORG, ME, {
        type: ConversationType.DIRECT,
        participantMembershipIds: [OTHER],
      });

      expect(result).toBe(existing);
    });
  });

  describe('findConversation', () => {
    it('throws NotFound for an unknown/other-org conversation', async () => {
      conversationsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findConversation(ORG, 'conv-x'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('isParticipant', () => {
    it('is true only when a participant row exists in the org', async () => {
      participantsRepo.count.mockResolvedValue(1);
      await expect(service.isParticipant(ORG, ME, 'conv-1')).resolves.toBe(
        true,
      );

      participantsRepo.count.mockResolvedValue(0);
      await expect(service.isParticipant(ORG, ME, 'conv-1')).resolves.toBe(
        false,
      );
    });
  });
});
