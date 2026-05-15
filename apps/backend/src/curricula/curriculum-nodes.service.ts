import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, IsNull, Repository } from 'typeorm';
import { CreateCurriculumNodeInput } from './dto/create-curriculum-node.input';
import { ReorderCurriculumNodesInput } from './dto/reorder-curriculum-nodes.input';
import { UpdateCurriculumNodeInput } from './dto/update-curriculum-node.input';
import { UpsertCurriculumNodeTranslationInput } from './dto/upsert-curriculum-node-translation.input';
import { CurriculumNodeType } from './enums/curriculum-node-type.enum';
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
