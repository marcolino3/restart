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
import { TeamAccessService } from '@/employee-management/teams/team-access.service';

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
        {
          provide: TeamAccessService,
          useValue: { getDirectMembershipIdsForTeam: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ChatsService);
  });

  describe('assertParticipant (multi-tenant gate)', () => {
    it('throws Forbidden when the membership is not a participant', async () => {
      // DIRECT conversation → authorization comes from a participant row.
      conversationsRepo.findOne.mockResolvedValue({
        id: 'conv-1',
        type: ConversationType.DIRECT,
      });
      participantsRepo.count.mockResolvedValue(0);

      await expect(
        service.assertParticipant(ORG, ME, 'conv-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('resolves DIRECT/GROUP access from a participant row', async () => {
      conversationsRepo.findOne.mockResolvedValue({
        id: 'conv-1',
        type: ConversationType.GROUP,
      });
      participantsRepo.count.mockResolvedValue(1);
      participantsRepo.findOne.mockResolvedValue({ id: 'p-1' });

      await expect(
        service.assertParticipant(ORG, ME, 'conv-1'),
      ).resolves.toBeTruthy();
    });

    it('resolves TEAM access LIVE from the team roster, not a participant row', async () => {
      conversationsRepo.findOne.mockResolvedValue({
        id: 'conv-t',
        type: ConversationType.TEAM,
        teamId: 'team-1',
      });
      const teamAccess = service['teamAccess'] as unknown as {
        getDirectMembershipIdsForTeam: jest.Mock;
      };
      teamAccess.getDirectMembershipIdsForTeam.mockResolvedValue([ME]);
      participantsRepo.findOne.mockResolvedValue({ id: 'read-state' });

      await expect(service.isParticipant(ORG, ME, 'conv-t')).resolves.toBe(
        true,
      );
      expect(teamAccess.getDirectMembershipIdsForTeam).toHaveBeenCalledWith(
        ORG,
        'team-1',
      );
    });

    it('denies TEAM access when the caller is not in the team roster', async () => {
      conversationsRepo.findOne.mockResolvedValue({
        id: 'conv-t',
        type: ConversationType.TEAM,
        teamId: 'team-1',
      });
      const teamAccess = service['teamAccess'] as unknown as {
        getDirectMembershipIdsForTeam: jest.Mock;
      };
      teamAccess.getDirectMembershipIdsForTeam.mockResolvedValue([OTHER]);

      await expect(service.isParticipant(ORG, ME, 'conv-t')).resolves.toBe(
        false,
      );
    });
  });

  describe('getMessages', () => {
    it('refuses to load messages of a conversation the caller is not in', async () => {
      // No such conversation → isParticipant false → assertParticipant throws.
      conversationsRepo.findOne.mockResolvedValue(null);

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
    it('for DIRECT/GROUP is true only when a participant row exists', async () => {
      conversationsRepo.findOne.mockResolvedValue({
        id: 'conv-1',
        type: ConversationType.DIRECT,
      });
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
