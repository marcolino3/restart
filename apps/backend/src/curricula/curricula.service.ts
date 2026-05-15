import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CreateCurriculumInput } from './dto/create-curriculum.input';
import { UpdateCurriculumInput } from './dto/update-curriculum.input';
import { UpsertCurriculumTranslationInput } from './dto/upsert-curriculum-translation.input';
import { CurriculumTranslation } from './entities/curriculum-translation.entity';
import { Curriculum } from './entities/curriculum.entity';

@Injectable()
export class CurriculaService {
  constructor(
    @InjectRepository(Curriculum)
    private readonly curriculaRepo: Repository<Curriculum>,
    @InjectRepository(CurriculumTranslation)
    private readonly translationsRepo: Repository<CurriculumTranslation>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllByOrgId(
    organizationId: string,
    includeArchived = false,
  ): Promise<Curriculum[]> {
    return this.curriculaRepo.find({
      where: {
        organizationId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      relations: ['translations'],
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Curriculum> {
    const curriculum = await this.curriculaRepo.findOne({
      where: { id, organizationId },
      relations: ['translations'],
    });
    if (!curriculum) {
      throw new NotFoundException(`Curriculum ${id} not found`);
    }
    return curriculum;
  }

  async create(
    input: CreateCurriculumInput,
    organizationId: string,
  ): Promise<Curriculum> {
    const slug = input.slug.trim().toLowerCase();
    this.assertUniqueLocales(input.translations.map((t) => t.locale));

    return this.dataSource.transaction(async (m) => {
      const clash = await m
        .getRepository(Curriculum)
        .exists({ where: { organizationId, slug } });
      if (clash) {
        throw new ConflictException(
          `Curriculum with slug "${slug}" already exists`,
        );
      }

      let position = input.position;
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

      const translations = input.translations.map((t) =>
        m.getRepository(CurriculumTranslation).create({
          curriculumId: saved.id,
          locale: t.locale,
          name: t.name,
          description: t.description ?? null,
        }),
      );
      await m.getRepository(CurriculumTranslation).save(translations);

      const reloaded = await m.getRepository(Curriculum).findOne({
        where: { id: saved.id },
        relations: ['translations'],
      });
      return reloaded!;
    });
  }

  async update(
    input: UpdateCurriculumInput,
    organizationId: string,
  ): Promise<Curriculum> {
    const curriculum = await this.findOne(input.id, organizationId);

    if (input.slug && input.slug !== curriculum.slug) {
      const slug = input.slug.trim().toLowerCase();
      const clash = await this.curriculaRepo.exists({
        where: { organizationId, slug },
      });
      if (clash) {
        throw new ConflictException(
          `Curriculum with slug "${slug}" already exists`,
        );
      }
      curriculum.slug = slug;
    }

    if (input.position !== undefined) {
      curriculum.position = input.position;
    }

    if (input.translations && input.translations.length > 0) {
      this.assertUniqueLocales(input.translations.map((t) => t.locale));
      await this.dataSource.transaction(async (m) => {
        for (const t of input.translations!) {
          await m.getRepository(CurriculumTranslation).upsert(
            {
              curriculumId: curriculum.id,
              locale: t.locale,
              name: t.name,
              description: t.description ?? null,
            },
            ['curriculumId', 'locale'],
          );
        }
      });
    }

    await this.curriculaRepo.save(curriculum);
    return this.findOne(curriculum.id, organizationId);
  }

  async archive(id: string, organizationId: string): Promise<boolean> {
    const curriculum = await this.findOne(id, organizationId);
    curriculum.isArchived = true;
    await this.curriculaRepo.save(curriculum);
    return true;
  }

  async unarchive(id: string, organizationId: string): Promise<Curriculum> {
    const curriculum = await this.findOne(id, organizationId);
    curriculum.isArchived = false;
    await this.curriculaRepo.save(curriculum);
    return this.findOne(id, organizationId);
  }

  async reorder(ids: string[], organizationId: string): Promise<Curriculum[]> {
    const curricula = await this.curriculaRepo.find({
      where: { id: In(ids), organizationId },
    });
    if (curricula.length !== ids.length) {
      throw new NotFoundException(
        'One or more curricula not found for this organization',
      );
    }
    const byId = new Map(curricula.map((c) => [c.id, c]));
    const toSave = ids.map((id, index) => {
      const curriculum = byId.get(id)!;
      curriculum.position = index;
      return curriculum;
    });
    await this.curriculaRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }

  async upsertTranslation(
    input: UpsertCurriculumTranslationInput,
    organizationId: string,
  ): Promise<CurriculumTranslation> {
    await this.findOne(input.curriculumId, organizationId);
    await this.translationsRepo.upsert(
      {
        curriculumId: input.curriculumId,
        locale: input.locale,
        name: input.name,
        description: input.description ?? null,
      },
      ['curriculumId', 'locale'],
    );
    const translation = await this.translationsRepo.findOne({
      where: { curriculumId: input.curriculumId, locale: input.locale },
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
