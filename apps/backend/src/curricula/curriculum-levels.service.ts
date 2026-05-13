import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CreateCurriculumLevelInput } from './dto/create-curriculum-level.input';
import { UpdateCurriculumLevelInput } from './dto/update-curriculum-level.input';
import { UpsertCurriculumLevelTranslationInput } from './dto/upsert-curriculum-level-translation.input';
import { CurriculumLevelTranslation } from './entities/curriculum-level-translation.entity';
import { CurriculumLevel } from './entities/curriculum-level.entity';

@Injectable()
export class CurriculumLevelsService {
  constructor(
    @InjectRepository(CurriculumLevel)
    private readonly levelsRepo: Repository<CurriculumLevel>,
    @InjectRepository(CurriculumLevelTranslation)
    private readonly translationsRepo: Repository<CurriculumLevelTranslation>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllByOrgId(
    organizationId: string,
    includeArchived = false,
  ): Promise<CurriculumLevel[]> {
    return this.levelsRepo.find({
      where: {
        organizationId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      relations: ['translations'],
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<CurriculumLevel> {
    const level = await this.levelsRepo.findOne({
      where: { id, organizationId },
      relations: ['translations'],
    });
    if (!level) {
      throw new NotFoundException(`Curriculum level ${id} not found`);
    }
    return level;
  }

  async create(
    input: CreateCurriculumLevelInput,
    organizationId: string,
  ): Promise<CurriculumLevel> {
    const slug = input.slug.trim().toLowerCase();
    this.assertUniqueLocales(input.translations.map((t) => t.locale));

    return this.dataSource.transaction(async (m) => {
      const clash = await m.getRepository(CurriculumLevel).exists({
        where: { organizationId, slug },
      });
      if (clash) {
        throw new ConflictException(
          `Curriculum level with slug "${slug}" already exists`,
        );
      }

      let position = input.position;
      if (position === undefined) {
        const max = await m
          .getRepository(CurriculumLevel)
          .createQueryBuilder('l')
          .select('MAX(l.position)', 'max')
          .where('l.organization_id = :orgId', { orgId: organizationId })
          .getRawOne<{ max: number | null }>();
        position = (max?.max ?? -1) + 1;
      }

      const level = m.getRepository(CurriculumLevel).create({
        slug,
        position,
        organizationId,
      });
      const saved = await m.getRepository(CurriculumLevel).save(level);

      const translations = input.translations.map((t) =>
        m.getRepository(CurriculumLevelTranslation).create({
          curriculumLevelId: saved.id,
          locale: t.locale,
          name: t.name,
        }),
      );
      await m.getRepository(CurriculumLevelTranslation).save(translations);

      const reloaded = await m.getRepository(CurriculumLevel).findOne({
        where: { id: saved.id },
        relations: ['translations'],
      });
      return reloaded!;
    });
  }

  async update(
    input: UpdateCurriculumLevelInput,
    organizationId: string,
  ): Promise<CurriculumLevel> {
    const level = await this.findOne(input.id, organizationId);

    if (input.slug && input.slug !== level.slug) {
      const slug = input.slug.trim().toLowerCase();
      const clash = await this.levelsRepo.exists({
        where: { organizationId, slug },
      });
      if (clash) {
        throw new ConflictException(
          `Curriculum level with slug "${slug}" already exists`,
        );
      }
      level.slug = slug;
    }

    if (input.position !== undefined) {
      level.position = input.position;
    }

    if (input.translations && input.translations.length > 0) {
      this.assertUniqueLocales(input.translations.map((t) => t.locale));
      await this.dataSource.transaction(async (m) => {
        for (const t of input.translations!) {
          await m.getRepository(CurriculumLevelTranslation).upsert(
            {
              curriculumLevelId: level.id,
              locale: t.locale,
              name: t.name,
            },
            ['curriculumLevelId', 'locale'],
          );
        }
      });
    }

    await this.levelsRepo.save(level);
    return this.findOne(level.id, organizationId);
  }

  async archive(id: string, organizationId: string): Promise<boolean> {
    const level = await this.findOne(id, organizationId);
    level.isArchived = true;
    await this.levelsRepo.save(level);
    return true;
  }

  async reorder(
    ids: string[],
    organizationId: string,
  ): Promise<CurriculumLevel[]> {
    const levels = await this.levelsRepo.find({
      where: { id: In(ids), organizationId },
    });
    if (levels.length !== ids.length) {
      throw new NotFoundException(
        'One or more curriculum levels not found for this organization',
      );
    }
    const byId = new Map(levels.map((l) => [l.id, l]));
    const toSave = ids.map((id, index) => {
      const level = byId.get(id)!;
      level.position = index;
      return level;
    });
    await this.levelsRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }

  async upsertTranslation(
    input: UpsertCurriculumLevelTranslationInput,
    organizationId: string,
  ): Promise<CurriculumLevelTranslation> {
    await this.findOne(input.curriculumLevelId, organizationId);
    await this.translationsRepo.upsert(
      {
        curriculumLevelId: input.curriculumLevelId,
        locale: input.locale,
        name: input.name,
      },
      ['curriculumLevelId', 'locale'],
    );
    const translation = await this.translationsRepo.findOne({
      where: {
        curriculumLevelId: input.curriculumLevelId,
        locale: input.locale,
      },
    });
    return translation!;
  }

  private assertUniqueLocales(locales: string[]): void {
    const seen = new Set<string>();
    for (const l of locales) {
      if (seen.has(l)) {
        throw new ConflictException(`Duplicate locale "${l}" in translations`);
      }
      seen.add(l);
    }
  }
}
