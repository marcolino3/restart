import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TeamsService } from './teams.service';
import { Team } from './entities/team.entity';

const ORG = 'org-1';
const OTHER_ORG = 'org-2';

type FindOneArgs = { where: Record<string, unknown> };

describe('TeamsService', () => {
  let service: TeamsService;
  let repo: jest.Mocked<
    Pick<Repository<Team>, 'findOne' | 'find' | 'create' | 'save' | 'update'>
  >;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((d: Partial<Team>) => d as Team),
      save: jest.fn((t: Team) => Promise.resolve(t)),
      update: jest.fn(() => Promise.resolve({ affected: 1 })),
    } as unknown as jest.Mocked<
      Pick<Repository<Team>, 'findOne' | 'find' | 'create' | 'save' | 'update'>
    >;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: getRepositoryToken(Team), useValue: repo },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('rejects a parent that does not exist in the org', async () => {
      repo.findOne.mockResolvedValue(null); // parent lookup → not found

      await expect(
        service.create({ name: 'Sub', parentId: 'missing' }, ORG),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('scopes the parent lookup to the active organization', async () => {
      repo.findOne.mockResolvedValue(null);

      await service
        .create({ name: 'Sub', parentId: 'p1' }, ORG)
        .catch(() => undefined);

      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'p1',
            organizationId: ORG,
            isActive: true,
          }),
        }),
      );
    });

    it('creates a nested team when the parent is valid', async () => {
      repo.findOne.mockImplementation((args: FindOneArgs) =>
        Promise.resolve(
          args.where.id === 'p1'
            ? ({ id: 'p1', organizationId: ORG, isActive: true } as Team)
            : null,
        ),
      );

      await service.create({ name: 'Sub', parentId: 'p1' }, ORG);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Sub',
          parentId: 'p1',
          organizationId: ORG,
        }),
      );
    });
  });

  describe('update / re-parenting', () => {
    it('rejects a team becoming its own parent', async () => {
      repo.findOne.mockImplementation((args: FindOneArgs) =>
        Promise.resolve(
          args.where.id === 'a'
            ? ({ id: 'a', organizationId: ORG, isActive: true } as Team)
            : null,
        ),
      );

      await expect(
        service.update({ id: 'a', parentId: 'a' }, ORG),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects moving a team under one of its own descendants (cycle)', async () => {
      // Tree: a → b. Attempt to set a.parent = b ⇒ cycle.
      repo.findOne.mockImplementation((args: FindOneArgs) => {
        if (args.where.id === 'a')
          return Promise.resolve({
            id: 'a',
            organizationId: ORG,
            isActive: true,
          } as Team);
        if (args.where.id === 'b')
          return Promise.resolve({
            id: 'b',
            organizationId: ORG,
            isActive: true,
            parentId: 'a',
          } as Team);
        return Promise.resolve(null);
      });

      await expect(
        service.update({ id: 'a', parentId: 'b' }, ORG),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows making a team a root again (parentId = null)', async () => {
      repo.findOne.mockResolvedValue({
        id: 'a',
        organizationId: ORG,
        isActive: true,
        parentId: 'x',
      } as Team);

      await service.update({ id: 'a', parentId: null }, ORG);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'a', parentId: null }),
      );
    });
  });

  describe('multi-tenant isolation', () => {
    it('does not find a team from another organization', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('a', OTHER_ORG)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: OTHER_ORG }),
        }),
      );
    });
  });

  describe('reorder', () => {
    it('sets sortOrder by index and leaves parents unchanged when parentId is omitted', async () => {
      repo.find.mockResolvedValue([
        { id: 'a', organizationId: ORG, isActive: true, parentId: 'p' } as Team,
        { id: 'b', organizationId: ORG, isActive: true, parentId: 'p' } as Team,
      ]);

      await service.reorder({ ids: ['b', 'a'] }, ORG);

      const saved = repo.save.mock.calls[0][0] as unknown as Team[];
      expect(saved).toEqual([
        expect.objectContaining({ id: 'b', sortOrder: 0, parentId: 'p' }),
        expect.objectContaining({ id: 'a', sortOrder: 1, parentId: 'p' }),
      ]);
    });

    it('re-parents the whole group when parentId is provided', async () => {
      repo.find.mockResolvedValue([
        { id: 'a', organizationId: ORG, isActive: true } as Team,
      ]);
      // assertParentInOrg + assertNoCycle lookups → valid, no cycle.
      repo.findOne.mockImplementation((args: FindOneArgs) =>
        Promise.resolve(
          args.where.id === 'newParent'
            ? ({ id: 'newParent', organizationId: ORG, isActive: true } as Team)
            : null,
        ),
      );

      await service.reorder({ ids: ['a'], parentId: 'newParent' }, ORG);

      const saved = repo.save.mock.calls[0][0] as unknown as Team[];
      expect(saved).toEqual([
        expect.objectContaining({ id: 'a', sortOrder: 0, parentId: 'newParent' }),
      ]);
    });

    it('moves the group to root when parentId is null', async () => {
      repo.find.mockResolvedValue([
        { id: 'a', organizationId: ORG, isActive: true, parentId: 'p' } as Team,
      ]);

      await service.reorder({ ids: ['a'], parentId: null }, ORG);

      const saved = repo.save.mock.calls[0][0] as unknown as Team[];
      expect(saved).toEqual([
        expect.objectContaining({ id: 'a', sortOrder: 0, parentId: null }),
      ]);
    });

    it('rejects re-parenting that would create a cycle', async () => {
      // Tree: a → b. Dropping a onto b ⇒ cycle.
      repo.find.mockResolvedValue([
        { id: 'a', organizationId: ORG, isActive: true } as Team,
      ]);
      repo.findOne.mockImplementation((args: FindOneArgs) => {
        if (args.where.id === 'b')
          return Promise.resolve({
            id: 'b',
            organizationId: ORG,
            isActive: true,
            parentId: 'a',
          } as Team);
        return Promise.resolve(null);
      });

      await expect(
        service.reorder({ ids: ['a'], parentId: 'b' }, ORG),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('lifts children up to the removed team’s parent before soft-deleting', async () => {
      repo.findOne.mockResolvedValue({
        id: 'a',
        organizationId: ORG,
        isActive: true,
        parentId: 'root',
      } as Team);

      await service.remove('a', ORG);

      expect(repo.update).toHaveBeenCalledWith(
        { parentId: 'a', organizationId: ORG },
        { parentId: 'root' },
      );
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'a', isActive: false }),
      );
    });
  });
});
