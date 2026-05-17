import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, IsNull, Repository } from 'typeorm';
import { CreateCurriculumNodeInput } from './dto/create-curriculum-node.input';
import { ReorderCurriculumNodesInput } from './dto/reorder-curriculum-nodes.input';
import { SetLessonPrerequisitesInput } from './dto/set-lesson-prerequisites.input';
import { UpdateCurriculumNodeInput } from './dto/update-curriculum-node.input';
import { UpsertCurriculumNodeTranslationInput } from './dto/upsert-curriculum-node-translation.input';
import { CurriculumNodeType } from './enums/curriculum-node-type.enum';
import { LessonRecordStatus } from './enums/lesson-record-status.enum';
import { LessonRecord } from './record-keeping/entities/lesson-record.entity';
import { CurriculumLevel } from './entities/curriculum-level.entity';
import { CurriculumNodeTranslation } from './entities/curriculum-node-translation.entity';
import { CurriculumNode } from './entities/curriculum-node.entity';
import { Curriculum } from './entities/curriculum.entity';

const NODE_TYPE_RANK: Record<CurriculumNodeType, number> = {
  [CurriculumNodeType.AREA]: 0,
  [CurriculumNodeType.TOPIC]: 1,
  [CurriculumNodeType.GROUP]: 2,
  [CurriculumNodeType.LESSON]: 3,
};

@Injectable()
export class CurriculumNodesService {
  constructor(
    @InjectRepository(CurriculumNode)
    private readonly nodesRepo: Repository<CurriculumNode>,
    @InjectRepository(CurriculumNodeTranslation)
    private readonly translationsRepo: Repository<CurriculumNodeTranslation>,
    @InjectRepository(Curriculum)
    private readonly curriculaRepo: Repository<Curriculum>,
    @InjectRepository(CurriculumLevel)
    private readonly levelsRepo: Repository<CurriculumLevel>,
    private readonly dataSource: DataSource,
  ) {}

  async findByCurriculumAndLevel(
    curriculumId: string,
    levelId: string,
    organizationId: string,
    includeArchived = false,
  ): Promise<CurriculumNode[]> {
    return this.nodesRepo.find({
      where: {
        organizationId,
        curriculumId,
        levelId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      relations: ['translations'],
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async findChildren(
    organizationId: string,
    curriculumId: string,
    levelId: string,
    parentId: string | null,
    includeArchived = false,
  ): Promise<CurriculumNode[]> {
    const where: FindOptionsWhere<CurriculumNode> = {
      organizationId,
      curriculumId,
      levelId,
      parentId: parentId === null ? IsNull() : parentId,
      ...(includeArchived ? {} : { isArchived: false }),
    };
    return this.nodesRepo.find({
      where,
      relations: ['translations'],
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<CurriculumNode> {
    const node = await this.nodesRepo.findOne({
      where: { id, organizationId },
      relations: ['translations'],
    });
    if (!node) {
      throw new NotFoundException(`Curriculum node ${id} not found`);
    }
    return node;
  }

  async create(
    input: CreateCurriculumNodeInput,
    organizationId: string,
  ): Promise<CurriculumNode> {
    this.assertUniqueLocales(input.translations.map((t) => t.locale));

    await this.assertCurriculumInOrg(input.curriculumId, organizationId);
    await this.assertLevelInOrg(input.levelId, organizationId);

    if (input.parentId) {
      await this.assertValidParent(
        input.parentId,
        organizationId,
        input.curriculumId,
        input.levelId,
        input.nodeType,
      );
    } else if (input.nodeType !== CurriculumNodeType.AREA) {
      throw new BadRequestException(
        `Only AREA nodes may have no parent (got ${input.nodeType})`,
      );
    }

    return this.dataSource.transaction(async (m) => {
      let position = input.position;
      if (position === undefined) {
        const max = await m
          .getRepository(CurriculumNode)
          .createQueryBuilder('n')
          .select('MAX(n.position)', 'max')
          .where('n.organization_id = :orgId', { orgId: organizationId })
          .andWhere('n.curriculum_id = :cId', { cId: input.curriculumId })
          .andWhere('n.level_id = :lId', { lId: input.levelId })
          .andWhere(
            input.parentId ? 'n.parent_id = :pId' : 'n.parent_id IS NULL',
            input.parentId ? { pId: input.parentId } : {},
          )
          .getRawOne<{ max: number | null }>();
        position = (max?.max ?? -1) + 1;
      }

      const node = m.getRepository(CurriculumNode).create({
        curriculumId: input.curriculumId,
        levelId: input.levelId,
        parentId: input.parentId ?? null,
        nodeType: input.nodeType,
        position,
        organizationId,
      });
      const saved = await m.getRepository(CurriculumNode).save(node);

      const translations = input.translations.map((t) =>
        m.getRepository(CurriculumNodeTranslation).create({
          curriculumNodeId: saved.id,
          locale: t.locale,
          name: t.name,
          notes: t.notes ?? null,
        }),
      );
      await m.getRepository(CurriculumNodeTranslation).save(translations);

      const reloaded = await m.getRepository(CurriculumNode).findOne({
        where: { id: saved.id },
        relations: ['translations'],
      });
      return reloaded!;
    });
  }

  async update(
    input: UpdateCurriculumNodeInput,
    organizationId: string,
  ): Promise<CurriculumNode> {
    const node = await this.findOne(input.id, organizationId);

    if (input.levelId && input.levelId !== node.levelId) {
      await this.assertLevelInOrg(input.levelId, organizationId);
      node.levelId = input.levelId;
    }

    const nextType = input.nodeType ?? node.nodeType;
    const nextParentId =
      input.parentId !== undefined ? input.parentId : node.parentId;

    if (nextParentId) {
      await this.assertValidParent(
        nextParentId,
        organizationId,
        node.curriculumId,
        node.levelId,
        nextType,
      );
    } else if (nextType !== CurriculumNodeType.AREA) {
      throw new BadRequestException(
        `Only AREA nodes may have no parent (got ${nextType})`,
      );
    }

    node.parentId = nextParentId ?? null;
    node.nodeType = nextType;
    if (input.position !== undefined) node.position = input.position;

    // lessonType / lessonScale dürfen nur für LESSON-Nodes gesetzt sein.
    if (input.lessonType !== undefined || input.lessonScale !== undefined) {
      if (nextType !== CurriculumNodeType.LESSON) {
        if (input.lessonType || input.lessonScale) {
          throw new BadRequestException(
            'lessonType / lessonScale dürfen nur für LESSON-Nodes gesetzt sein',
          );
        }
      }
      if (input.lessonType !== undefined) node.lessonType = input.lessonType;
      if (input.lessonScale !== undefined) node.lessonScale = input.lessonScale;
    }
    // Bei Typ-Wechsel weg von LESSON: lesson-Attribute auf null setzen
    if (nextType !== CurriculumNodeType.LESSON) {
      node.lessonType = null;
      node.lessonScale = null;
    }

    if (input.translations && input.translations.length > 0) {
      this.assertUniqueLocales(input.translations.map((t) => t.locale));
      await this.dataSource.transaction(async (m) => {
        for (const t of input.translations!) {
          await m.getRepository(CurriculumNodeTranslation).upsert(
            {
              curriculumNodeId: node.id,
              locale: t.locale,
              name: t.name,
              notes: t.notes ?? null,
            },
            ['curriculumNodeId', 'locale'],
          );
        }
      });
    }

    await this.nodesRepo.save(node);
    return this.findOne(node.id, organizationId);
  }

  async archive(id: string, organizationId: string): Promise<boolean> {
    const node = await this.findOne(id, organizationId);
    const ids = await this.collectSubtreeIds(node.id, organizationId);
    await this.nodesRepo.update(
      { id: In(ids), organizationId },
      { isArchived: true },
    );
    return true;
  }

  async unarchive(id: string, organizationId: string): Promise<boolean> {
    const node = await this.findOne(id, organizationId);
    const ids = await this.collectSubtreeIds(node.id, organizationId);
    await this.nodesRepo.update(
      { id: In(ids), organizationId },
      { isArchived: false },
    );
    return true;
  }

  async reorder(
    input: ReorderCurriculumNodesInput,
    organizationId: string,
  ): Promise<CurriculumNode[]> {
    const nodes = await this.nodesRepo.find({
      where: {
        id: In(input.ids),
        organizationId,
        curriculumId: input.curriculumId,
        levelId: input.levelId,
        parentId:
          input.parentId === null || input.parentId === undefined
            ? IsNull()
            : input.parentId,
      },
    });
    if (nodes.length !== input.ids.length) {
      throw new NotFoundException(
        'One or more nodes not found in the given curriculum/level/parent scope',
      );
    }
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const toSave = input.ids.map((id, index) => {
      const node = byId.get(id)!;
      node.position = index;
      return node;
    });
    await this.nodesRepo.save(toSave);
    return this.findChildren(
      organizationId,
      input.curriculumId,
      input.levelId,
      input.parentId ?? null,
    );
  }

  async upsertTranslation(
    input: UpsertCurriculumNodeTranslationInput,
    organizationId: string,
  ): Promise<CurriculumNodeTranslation> {
    await this.findOne(input.curriculumNodeId, organizationId);
    await this.translationsRepo.upsert(
      {
        curriculumNodeId: input.curriculumNodeId,
        locale: input.locale,
        name: input.name,
        notes: input.notes ?? null,
      },
      ['curriculumNodeId', 'locale'],
    );
    const translation = await this.translationsRepo.findOne({
      where: {
        curriculumNodeId: input.curriculumNodeId,
        locale: input.locale,
      },
    });
    return translation!;
  }

  /**
   * Alle LESSON-Nodes der Org, mit Translations.
   * Für UI-Pickers (RecordKeeping Bulk-Entry, Prerequisites-Editor).
   */
  async findAllLessons(
    organizationId: string,
    includeArchived = false,
  ): Promise<CurriculumNode[]> {
    return this.nodesRepo.find({
      where: {
        organizationId,
        nodeType: CurriculumNodeType.LESSON,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      relations: ['translations'],
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Alle AREA-Nodes der Org. Wird vom Kind-Profil-Radar genutzt
   * (alle Bereiche als Achsen, auch ohne Eintragungen).
   */
  async findAllAreas(
    organizationId: string,
    includeArchived = false,
  ): Promise<CurriculumNode[]> {
    return this.nodesRepo.find({
      where: {
        organizationId,
        nodeType: CurriculumNodeType.AREA,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      relations: ['translations'],
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * For each AREA in the org, count active LESSON descendants across the
   * whole sub-tree (AREA → TOPIC → GROUP → LESSON). Used as the curriculum-
   * wide denominator for the per-area progress radar so percentages are
   * relative to "all lessons in this area" rather than "lessons tracked
   * so far".
   */
  async findAreaLessonCounts(organizationId: string): Promise<
    {
      areaId: string;
      lessonCount: number;
      curriculumId: string | null;
      curriculumName: string | null;
    }[]
  > {
    // Translation pick prefers DE then EN then any other locale, fallback
    // to the bare curriculum row's `id` if no translation exists.
    const rows = await this.dataSource.query<
      {
        area_id: string;
        lesson_count: string;
        curriculum_id: string | null;
        curriculum_name: string | null;
      }[]
    >(
      // Per AREA hat jeder Knoten genau ein curriculum_id (vererbt vom
      // AREA-Root). Wir grouppieren also nach (area_id, curriculum_id) und
      // ziehen den Namen via Sub-Select aus curriculum_translations.
      // Vorherige Variante nutzte MAX(uuid), das in Postgres keinen
      // Aggregator hat → "function max(uuid) does not exist".
      `WITH RECURSIVE areas AS (
         SELECT id AS root_id, id, parent_id, node_type, "isArchived"
         FROM curriculum_nodes
         WHERE organization_id = $1
           AND node_type = 'AREA'
           AND "isArchived" = false
       UNION ALL
         SELECT a.root_id, n.id, n.parent_id, n.node_type, n."isArchived"
         FROM curriculum_nodes n
         JOIN areas a ON n.parent_id = a.id
         WHERE n."isArchived" = false
       )
       SELECT a.root_id AS area_id,
              COUNT(*) FILTER (WHERE a.node_type = 'LESSON') AS lesson_count,
              root.curriculum_id::text AS curriculum_id,
              COALESCE(
                (SELECT ct.name FROM curriculum_translations ct
                  WHERE ct.curriculum_id = root.curriculum_id AND ct.locale = 'DE' LIMIT 1),
                (SELECT ct.name FROM curriculum_translations ct
                  WHERE ct.curriculum_id = root.curriculum_id AND ct.locale = 'EN' LIMIT 1),
                (SELECT ct.name FROM curriculum_translations ct
                  WHERE ct.curriculum_id = root.curriculum_id LIMIT 1)
              ) AS curriculum_name
       FROM areas a
       JOIN curriculum_nodes root ON root.id = a.root_id
       GROUP BY a.root_id, root.curriculum_id`,
      [organizationId],
    );
    return rows.map((r) => ({
      areaId: r.area_id,
      lessonCount: Number(r.lesson_count),
      curriculumId: r.curriculum_id,
      curriculumName: r.curriculum_name,
    }));
  }

  // ─────────────────────────────────────────────────────────────────
  // Prerequisites (Self-M2M auf LESSON-Nodes)
  // ─────────────────────────────────────────────────────────────────

  async getPrerequisites(
    lessonId: string,
    organizationId: string,
  ): Promise<CurriculumNode[]> {
    await this.assertLessonInOrg(lessonId, organizationId);
    const lesson = await this.nodesRepo.findOne({
      where: { id: lessonId, organizationId },
      relations: ['prerequisites', 'prerequisites.translations'],
    });
    return lesson?.prerequisites ?? [];
  }

  async setLessonPrerequisites(
    input: SetLessonPrerequisitesInput,
    organizationId: string,
  ): Promise<CurriculumNode> {
    const lesson = await this.assertLessonInOrg(input.lessonId, organizationId);

    if (input.prerequisiteIds.includes(input.lessonId)) {
      throw new BadRequestException('A lesson cannot be its own prerequisite');
    }

    if (input.prerequisiteIds.length > 0) {
      const prereqs = await this.nodesRepo.find({
        where: {
          id: In(input.prerequisiteIds),
          organizationId,
        },
      });
      if (prereqs.length !== input.prerequisiteIds.length) {
        throw new BadRequestException(
          'One or more prerequisite lessons not found in this organization',
        );
      }
      for (const p of prereqs) {
        if (p.nodeType !== CurriculumNodeType.LESSON) {
          throw new BadRequestException(
            `Prerequisite ${p.id} must be a LESSON (got ${p.nodeType})`,
          );
        }
      }

      // Zyklen-Schutz: lessonId darf NICHT erreichbar sein über die
      // transitive Hülle der prerequisiteIds.
      await this.assertNoPrerequisiteCycle(
        input.lessonId,
        input.prerequisiteIds,
        organizationId,
      );
    }

    await this.dataSource.transaction(async (m) => {
      await m.query(
        `DELETE FROM "curriculum_lesson_prerequisites" WHERE "lesson_id" = $1`,
        [input.lessonId],
      );
      if (input.prerequisiteIds.length > 0) {
        const values = input.prerequisiteIds
          .map((_, i) => `($1, $${i + 2})`)
          .join(', ');
        await m.query(
          `INSERT INTO "curriculum_lesson_prerequisites"
             ("lesson_id", "prerequisite_id")
           VALUES ${values}
           ON CONFLICT DO NOTHING`,
          [input.lessonId, ...input.prerequisiteIds],
        );
      }
    });

    const reloaded = await this.nodesRepo.findOne({
      where: { id: lesson.id, organizationId },
      relations: ['prerequisites', 'prerequisites.translations', 'translations'],
    });
    return reloaded!;
  }

  /**
   * "Was kommt als naechstes" für ein Kind.
   *
   * Eine Lektion ist "verfügbar" wenn:
   *  - sie LESSON-Type ist und nicht archiviert
   *  - das Kind noch keinen Record mit status ∈ {INTRODUCED, PRACTICED, MASTERED}
   *    für diese Lektion hat
   *  - alle ihre Prerequisites einen Record mit status ∈ {INTRODUCED, PRACTICED, MASTERED, NEEDS_MORE}
   *    für dieses Kind haben (PLANNING zählt NICHT als erfüllt)
   *
   * Sortierung: curriculumLevel-Order (über parent), dann position.
   */
  async getNextLessonsForStudent(
    studentId: string,
    organizationId: string,
    limit = 20,
  ): Promise<CurriculumNode[]> {
    const STARTED_STATUSES: LessonRecordStatus[] = [
      LessonRecordStatus.INTRODUCED,
      LessonRecordStatus.PRACTICED,
      LessonRecordStatus.MASTERED,
    ];
    const PREREQ_MET_STATUSES: LessonRecordStatus[] = [
      LessonRecordStatus.INTRODUCED,
      LessonRecordStatus.PRACTICED,
      LessonRecordStatus.MASTERED,
      LessonRecordStatus.NEEDS_MORE,
    ];

    const lessonRecordRepo = this.dataSource.getRepository(LessonRecord);

    // 1. Bereits begonnene Lessons für dieses Kind (zum Ausschluss).
    const started = await lessonRecordRepo
      .createQueryBuilder('r')
      .select('DISTINCT r.lesson_id', 'lessonId')
      .where('r.organization_id = :orgId', { orgId: organizationId })
      .andWhere('r.student_id = :sId', { sId: studentId })
      .andWhere('r.status IN (:...statuses)', { statuses: STARTED_STATUSES })
      .getRawMany<{ lessonId: string }>();
    const startedIds = new Set(started.map((r) => r.lessonId));

    // 2. Erfüllte Prerequisites (Lessons mit Record-Status >= INTRODUCED oder NEEDS_MORE).
    const metRows = await lessonRecordRepo
      .createQueryBuilder('r')
      .select('DISTINCT r.lesson_id', 'lessonId')
      .where('r.organization_id = :orgId', { orgId: organizationId })
      .andWhere('r.student_id = :sId', { sId: studentId })
      .andWhere('r.status IN (:...statuses)', {
        statuses: PREREQ_MET_STATUSES,
      })
      .getRawMany<{ lessonId: string }>();
    const metIds = new Set(metRows.map((r) => r.lessonId));

    // 3. Alle nicht-archivierten LESSON-Nodes der Org laden, inkl. prereqs.
    const candidates = await this.nodesRepo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.translations', 't')
      .leftJoinAndSelect('n.prerequisites', 'p')
      .where('n.organization_id = :orgId', { orgId: organizationId })
      .andWhere('n.node_type = :lessonType', {
        lessonType: CurriculumNodeType.LESSON,
      })
      .andWhere('n."isArchived" = false')
      .orderBy('n.position', 'ASC')
      .getMany();

    const result: CurriculumNode[] = [];
    for (const c of candidates) {
      if (startedIds.has(c.id)) continue;
      const prereqs = c.prerequisites ?? [];
      const allMet = prereqs.every((p) => metIds.has(p.id));
      if (!allMet) continue;
      result.push(c);
      if (result.length >= limit) break;
    }
    return result;
  }

  private async assertLessonInOrg(
    lessonId: string,
    organizationId: string,
  ): Promise<CurriculumNode> {
    const lesson = await this.nodesRepo.findOne({
      where: { id: lessonId, organizationId },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonId} not found`);
    }
    if (lesson.nodeType !== CurriculumNodeType.LESSON) {
      throw new BadRequestException(
        `Node ${lessonId} is ${lesson.nodeType}, expected LESSON`,
      );
    }
    return lesson;
  }

  /**
   * BFS über die Prerequisite-Kanten der vorgeschlagenen Prerequisites.
   * Wenn lessonId in deren transitiver Hülle erreichbar ist → Zyklus.
   */
  private async assertNoPrerequisiteCycle(
    lessonId: string,
    proposedPrerequisiteIds: string[],
    organizationId: string,
  ): Promise<void> {
    const visited = new Set<string>(proposedPrerequisiteIds);
    let frontier = [...proposedPrerequisiteIds];
    while (frontier.length > 0) {
      if (visited.has(lessonId)) {
        throw new BadRequestException(
          'Setting these prerequisites would create a cycle',
        );
      }
      // Cross-Org-Sicherheit: über JOIN auf curriculum_nodes filtern,
      // damit Prerequisites aus fremden Orgs nicht in den Cycle-Check fallen.
      const rows: Array<{ prerequisite_id: string }> = await this.dataSource
        .query(
          `SELECT clp."prerequisite_id"
             FROM "curriculum_lesson_prerequisites" clp
             INNER JOIN "curriculum_nodes" l ON l."id" = clp."lesson_id"
            WHERE l."organization_id" = $1
              AND clp."lesson_id" = ANY($2::uuid[])`,
          [organizationId, frontier],
        );
      const next: string[] = [];
      for (const r of rows) {
        if (r.prerequisite_id === lessonId) {
          throw new BadRequestException(
            'Setting these prerequisites would create a cycle',
          );
        }
        if (!visited.has(r.prerequisite_id)) {
          visited.add(r.prerequisite_id);
          next.push(r.prerequisite_id);
        }
      }
      frontier = next;
    }
  }

  private async assertCurriculumInOrg(
    curriculumId: string,
    organizationId: string,
  ): Promise<void> {
    const exists = await this.curriculaRepo.exists({
      where: { id: curriculumId, organizationId },
    });
    if (!exists) {
      throw new NotFoundException(`Curriculum ${curriculumId} not found`);
    }
  }

  private async assertLevelInOrg(
    levelId: string,
    organizationId: string,
  ): Promise<void> {
    const exists = await this.levelsRepo.exists({
      where: { id: levelId, organizationId },
    });
    if (!exists) {
      throw new NotFoundException(`Curriculum level ${levelId} not found`);
    }
  }

  private async assertValidParent(
    parentId: string,
    organizationId: string,
    curriculumId: string,
    levelId: string,
    childType: CurriculumNodeType,
  ): Promise<void> {
    const parent = await this.nodesRepo.findOne({
      where: { id: parentId, organizationId },
    });
    if (!parent) {
      throw new NotFoundException(`Parent node ${parentId} not found`);
    }
    if (parent.curriculumId !== curriculumId || parent.levelId !== levelId) {
      throw new BadRequestException(
        'Parent must belong to the same curriculum and level',
      );
    }
    if (NODE_TYPE_RANK[childType] <= NODE_TYPE_RANK[parent.nodeType]) {
      throw new BadRequestException(
        `Node of type ${childType} cannot be a child of ${parent.nodeType}`,
      );
    }
  }

  private async collectSubtreeIds(
    rootId: string,
    organizationId: string,
  ): Promise<string[]> {
    const collected = new Set<string>([rootId]);
    let frontier: string[] = [rootId];
    while (frontier.length > 0) {
      const children = await this.nodesRepo.find({
        where: { parentId: In(frontier), organizationId },
        select: ['id'],
      });
      frontier = children.map((c) => c.id).filter((id) => !collected.has(id));
      for (const id of frontier) collected.add(id);
    }
    return Array.from(collected);
  }

  private assertUniqueLocales(locales: string[]): void {
    const seen = new Set<string>();
    for (const l of locales) {
      if (seen.has(l)) {
        throw new BadRequestException(
          `Duplicate locale "${l}" in translations`,
        );
      }
      seen.add(l);
    }
  }
}
