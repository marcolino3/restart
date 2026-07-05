import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { AgendaGoal } from './entities/agenda-goal.enum';
import { ProtocolTemplate } from './entities/protocol-template.entity';
import { Protocol } from './entities/protocol.entity';
import { ProtocolTemplatesService } from './protocol-templates.service';

const ORG = 'org-1';

describe('ProtocolTemplatesService', () => {
  let service: ProtocolTemplatesService;
  let templatesRepo: Record<string, jest.Mock>;
  let protocolsRepo: Record<string, jest.Mock>;
  let membershipsRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    templatesRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn((d) => Promise.resolve(d)),
      create: jest.fn((d) => d),
      increment: jest.fn(),
    };
    protocolsRepo = { findOne: jest.fn() };
    membershipsRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProtocolTemplatesService,
        {
          provide: getRepositoryToken(ProtocolTemplate),
          useValue: templatesRepo,
        },
        { provide: getRepositoryToken(Protocol), useValue: protocolsRepo },
        { provide: getRepositoryToken(Membership), useValue: membershipsRepo },
      ],
    }).compile();

    service = module.get(ProtocolTemplatesService);
  });

  it('findAll scopes templates to the active organization', async () => {
    templatesRepo.find.mockResolvedValue([]);
    await service.findAll(ORG);
    expect(templatesRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG, isActive: true },
      }),
    );
  });

  it('create keeps only memberships of the active org as default participants', async () => {
    membershipsRepo.find.mockResolvedValue([{ id: 'm1' }]);

    const template = await service.create(
      {
        title: ' Teamsitzung ',
        agendaItems: [{ topic: 'Budget', goal: AgendaGoal.DECISION }],
        defaultParticipantMembershipIds: ['m1', 'foreign'],
      },
      ORG,
      'creator',
    );

    expect(template.title).toBe('Teamsitzung');
    expect(template.defaultParticipantMembershipIds).toEqual(['m1']);
    expect(template.agendaItems).toEqual([
      { no: 1, topic: 'Budget', goal: AgendaGoal.DECISION },
    ]);
  });

  it('apply returns agenda + surviving participants and counts the usage', async () => {
    templatesRepo.findOne.mockResolvedValue({
      id: 'tpl1',
      organizationId: ORG,
      agendaItems: [{ topic: 'Sommerfest', goal: null }],
      defaultParticipantMembershipIds: ['m1', 'gone'],
    });
    membershipsRepo.find.mockResolvedValue([{ id: 'm1' }]);

    const applied = await service.apply('tpl1', ORG);

    expect(templatesRepo.increment).toHaveBeenCalledWith(
      { id: 'tpl1', organizationId: ORG },
      'usedCount',
      1,
    );
    expect(applied.agendaItems).toEqual([
      { no: 1, topic: 'Sommerfest', goal: null },
    ]);
    expect(applied.participantMembershipIds).toEqual(['m1']);
  });

  it('apply rejects templates of another organization', async () => {
    templatesRepo.findOne.mockResolvedValue(null);
    await expect(service.apply('tpl-foreign', ORG)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(templatesRepo.increment).not.toHaveBeenCalled();
  });

  it('saveProtocolAsTemplate snapshots agenda + active participants only', async () => {
    protocolsRepo.findOne.mockResolvedValue({
      id: 'proto1',
      organizationId: ORG,
      sections: {
        agendaItems: [{ no: 9, topic: 'Pausenaufsicht', goal: null }],
      },
      participants: [
        { membershipId: 'm1', isActive: true },
        { membershipId: 'm2', isActive: false },
      ],
    });

    const template = await service.saveProtocolAsTemplate(
      { protocolId: 'proto1', title: 'Teamsitzung' },
      ORG,
      'creator',
    );

    expect(protocolsRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'proto1', organizationId: ORG, isActive: true },
      }),
    );
    expect(template.agendaItems).toEqual([
      { no: 1, topic: 'Pausenaufsicht', goal: null },
    ]);
    expect(template.defaultParticipantMembershipIds).toEqual(['m1']);
    expect(template.usedCount).toBe(0);
  });
});
