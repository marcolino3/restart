import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CurriculumNodesService } from './curriculum-nodes.service';
import { CurriculumLevel } from './entities/curriculum-level.entity';
import { CurriculumNodeTranslation } from './entities/curriculum-node-translation.entity';
import { CurriculumNode } from './entities/curriculum-node.entity';
import { Curriculum } from './entities/curriculum.entity';
import { CurriculumNodeType } from './enums/curriculum-node-type.enum';

/**
 * Fokus: Prerequisite-Logik (Self-Reference, Cross-Org, Zyklen-Schutz).
 */
describe('CurriculumNodesService.setLessonPrerequisites', () => {
  let service: CurriculumNodesService;
  let nodesRepo: { findOne: jest.Mock; find: jest.Mock };
  let dataSource: { transaction: jest.Mock; query: jest.Mock };

  const lessonNode = (id: string, orgId = 'org-1') => ({
    id,
    organizationId: orgId,
    nodeType: CurriculumNodeType.LESSON,
  });

  beforeEach(async () => {
    nodesRepo = { findOne: jest.fn(), find: jest.fn() };
    dataSource = { transaction: jest.fn(), query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurriculumNodesService,
        { provide: getRepositoryToken(CurriculumNode), useValue: nodesRepo },
        {
          provide: getRepositoryToken(CurriculumNodeTranslation),
          useValue: {},
        },
        { provide: getRepositoryToken(Curriculum), useValue: {} },
        { provide: getRepositoryToken(CurriculumLevel), useValue: {} },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<CurriculumNodesService>(CurriculumNodesService);
  });

  it('rejects self-reference', async () => {
    nodesRepo.findOne.mockResolvedValueOnce(lessonNode('les-1'));
    await expect(
      service.setLessonPrerequisites(
        { lessonId: 'les-1', prerequisiteIds: ['les-1'] },
        'org-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when target lesson is in a different org (multi-tenant)', async () => {
    nodesRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      service.setLessonPrerequisites(
        { lessonId: 'les-1', prerequisiteIds: ['les-2'] },
        'org-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects when prerequisite belongs to a different org (multi-tenant)', async () => {
    nodesRepo.findOne.mockResolvedValueOnce(lessonNode('les-1'));
    nodesRepo.find.mockResolvedValueOnce([]); // les-2 not found in org-1
    await expect(
      service.setLessonPrerequisites(
        { lessonId: 'les-1', prerequisiteIds: ['les-2'] },
        'org-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when prerequisite is not a LESSON node', async () => {
    nodesRepo.findOne.mockResolvedValueOnce(lessonNode('les-1'));
    nodesRepo.find.mockResolvedValueOnce([
      {
        id: 'grp-1',
        organizationId: 'org-1',
        nodeType: CurriculumNodeType.GROUP,
      },
    ]);
    await expect(
      service.setLessonPrerequisites(
        { lessonId: 'les-1', prerequisiteIds: ['grp-1'] },
        'org-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('detects a cycle: setting B as prerequisite of A when A is already a transitive prerequisite of B', async () => {
    // Lesson A=les-1 will get prerequisite B=les-2.
    // But existing graph already has B → A (B has A as prerequisite),
    // so making B a prerequisite of A would create A → B → A cycle.
    nodesRepo.findOne.mockResolvedValueOnce(lessonNode('les-1'));
    nodesRepo.find.mockResolvedValueOnce([lessonNode('les-2')]);

    // BFS from [les-2]: query returns "les-2 → les-1" → cycle.
    dataSource.query.mockResolvedValueOnce([{ prerequisite_id: 'les-1' }]);

    await expect(
      service.setLessonPrerequisites(
        { lessonId: 'les-1', prerequisiteIds: ['les-2'] },
        'org-1',
      ),
    ).rejects.toThrow(/cycle/i);
  });
});
