import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CurriculumLevelTranslation } from '../entities/curriculum-level-translation.entity';
import { CurriculumLevel } from '../entities/curriculum-level.entity';
import { CurriculumNodeTranslation } from '../entities/curriculum-node-translation.entity';
import { CurriculumNode } from '../entities/curriculum-node.entity';
import { CurriculumTranslation } from '../entities/curriculum-translation.entity';
import { Curriculum } from '../entities/curriculum.entity';
import { CurriculumNodeType } from '../enums/curriculum-node-type.enum';
import { parseCurriculumFile } from './curriculum-file-parser';
import { buildImportPlan } from './curriculum-plan-builder';
import {
  ImportCurriculumPlanInput,
  ImportPlanLevelInput,
  ImportPlanNodeInput,
} from './dto/import-curriculum-plan.input';
import { ImportPlanType } from './dto/import-plan.types';

const NODE_TYPE_RANK: Record<CurriculumNodeType, number> = {
  [CurriculumNodeType.AREA]: 0,
  [CurriculumNodeType.TOPIC]: 1,
  [CurriculumNodeType.GROUP]: 2,
  [CurriculumNodeType.LESSON]: 3,
};

@Injectable()
export class CurriculaImportService {
  constructor(
    @InjectRepository(Curriculum)
    private readonly curriculaRepo: Repository<Curriculum>,
    private readonly dataSource: DataSource,
  ) {}

  previewFromBuffer(buffer: Buffer, filename: string): ImportPlanType {
    const parsed = parseCurriculumFile(buffer, filename);
    const plan = buildImportPlan(parsed);
    return plan;
  }

  async applyPlan(
    input: ImportCurriculumPlanInput,
    organizationId: string,
  ): Promise<Curriculum> {
    this.assertUniqueLocales(
      input.curriculumTranslations.map((t) => t.locale),
      'curriculum',
    );
    for (const level of input.levels) {
      this.assertUniqueLocales(
        level.translations.map((t) => t.locale),
        `level "${level.slug}"`,
      );
      this.validateNodeTypes(level.roots, null, level.slug);
    }

    return this.dataSource.transaction(async (m) => {
      const curriculum = await this.upsertCurriculum(m, input, organizationId);
      const levelIdBySlug = await this.upsertLevels(
        m,
        input.levels,
        curriculum.id,
        organizationId,
      );

      for (const level of input.levels) {
        const levelId = levelIdBySlug.get(level.slug)!;
        await this.persistTree(m, level.roots, {
          curriculumId: curriculum.id,
          levelId,
          organizationId,
          parentId: null,
        });
      }

      const reloaded = await m.getRepository(Curriculum).findOne({
        where: { id: curriculum.id },
        relations: ['translations'],
      });
      return reloaded!;
    });
  }

  private async upsertCurriculum(
    m: EntityManager,
    input: ImportCurriculumPlanInput,
    organizationId: string,
  ): Promise<Curriculum> {
    const slug = input.curriculumSlug.trim().toLowerCase();
    const clash = await m
      .getRepository(Curriculum)
      .exists({ where: { organizationId, slug } });
    if (clash) {
      throw new ConflictException(
        `Curriculum with slug "${slug}" already exists`,
      );
    }

    let position = input.curriculumPosition;
    if (position === undefined) {
      const max = await m
        .getRepository(Curriculum)
        .createQueryBuilder('c')
        .select('MAX(c.position)', 'max')
        .where('c.organization_id = :orgId', { orgId: organizationId })
        .getRawOne<{ max: number | null }>();
      position = (max?.max ?? -1) + 1;
    }

    const curriculum = m.getRepository(Curriculum).create({
      slug,
      position,
      organizationId,
    });
    const saved = await m.getRepository(Curriculum).save(curriculum);

    const translations = input.curriculumTranslations.map((t) =>
      m.getRepository(CurriculumTranslation).create({
        curriculumId: saved.id,
        locale: t.locale,
        name: t.name,
        description: null,
      }),
    );
    await m.getRepository(CurriculumTranslation).save(translations);
    return saved;
  }

  private async upsertLevels(
    m: EntityManager,
    levels: ImportPlanLevelInput[],
    curriculumId: string,
    organizationId: string,
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    for (const level of levels) {
      const slug = level.slug.trim().toLowerCase();
      const existing = await m.getRepository(CurriculumLevel).findOne({
        where: { curriculumId, slug },
      });
      if (existing) {
        result.set(level.slug, existing.id);
        for (const t of level.translations) {
          await m.getRepository(CurriculumLevelTranslation).upsert(
            {
              curriculumLevelId: existing.id,
              locale: t.locale,
              name: t.name,
            },
            ['curriculumLevelId', 'locale'],
          );
        }
        continue;
      }

      const created = m.getRepository(CurriculumLevel).create({
        slug,
        position: level.position,
        curriculumId,
        organizationId,
      });
      const saved = await m.getRepository(CurriculumLevel).save(created);
      result.set(level.slug, saved.id);

      const translations = level.translations.map((t) =>
        m.getRepository(CurriculumLevelTranslation).create({
          curriculumLevelId: saved.id,
          locale: t.locale,
          name: t.name,
        }),
      );
      await m.getRepository(CurriculumLevelTranslation).save(translations);
    }
    return result;
  }

  private async persistTree(
    m: EntityManager,
    nodes: ImportPlanNodeInput[],
    scope: {
      curriculumId: string;
      levelId: string;
      organizationId: string;
      parentId: string | null;
    },
  ): Promise<void> {
    let position = 0;
    for (const node of nodes) {
      const created = m.getRepository(CurriculumNode).create({
        curriculumId: scope.curriculumId,
        levelId: scope.levelId,
        organizationId: scope.organizationId,
        parentId: scope.parentId,
        nodeType: node.nodeType,
        position,
      });
      const saved = await m.getRepository(CurriculumNode).save(created);
      position += 1;

      const translations = node.translations.map((t) =>
        m.getRepository(CurriculumNodeTranslation).create({
          curriculumNodeId: saved.id,
          locale: t.locale,
          name: t.name,
          notes: t.notes ?? null,
        }),
      );
      await m.getRepository(CurriculumNodeTranslation).save(translations);

      if (node.children.length > 0) {
        await this.persistTree(m, node.children, {
          ...scope,
          parentId: saved.id,
        });
      }
    }
  }

  private validateNodeTypes(
    nodes: ImportPlanNodeInput[],
    parentType: CurriculumNodeType | null,
    levelSlug: string,
  ): void {
    for (const node of nodes) {
      if (parentType === null) {
        if (node.nodeType === CurriculumNodeType.LESSON) {
          // tolerated: rank(LESSON) > rank(any), but root LESSON is unusual — flag downstream
        }
      } else if (NODE_TYPE_RANK[node.nodeType] <= NODE_TYPE_RANK[parentType]) {
        throw new BadRequestException(
          `Level "${levelSlug}": node of type ${node.nodeType} cannot be a child of ${parentType}`,
        );
      }
      if (node.children.length > 0) {
        this.validateNodeTypes(node.children, node.nodeType, levelSlug);
      }
      this.assertUniqueLocales(
        node.translations.map((t) => t.locale),
        `node (row ${node.position} under level "${levelSlug}")`,
      );
    }
  }

  private assertUniqueLocales(locales: string[], scope: string): void {
    const seen = new Set<string>();
    for (const l of locales) {
      if (seen.has(l)) {
        throw new ConflictException(
          `Duplicate locale "${l}" in translations of ${scope}`,
        );
      }
      seen.add(l);
    }
  }
}
