import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdmissionStage } from './entities/admission-stage.entity';
import { CreateAdmissionStageInput } from './dto/create-admission-stage.input';
import { UpdateAdmissionStageInput } from './dto/update-admission-stage.input';
import { AdmissionStageType } from './enums/admission-stage-type.enum';

@Injectable()
export class AdmissionStagesService {
  constructor(
    @InjectRepository(AdmissionStage)
    private readonly stagesRepo: Repository<AdmissionStage>,
  ) {}

  async findAllByOrgId(
    organizationId: string,
    includeArchived = false,
  ): Promise<AdmissionStage[]> {
    return this.stagesRepo.find({
      where: {
        organizationId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<AdmissionStage> {
    const stage = await this.stagesRepo.findOne({
      where: { id, organizationId },
    });
    if (!stage) {
      throw new NotFoundException(`Admission stage ${id} not found`);
    }
    return stage;
  }

  async findDefault(
    organizationId: string,
  ): Promise<AdmissionStage | null> {
    return this.stagesRepo.findOne({
      where: { organizationId, isDefault: true, isArchived: false },
    });
  }

  async create(
    input: CreateAdmissionStageInput,
    organizationId: string,
  ): Promise<AdmissionStage> {
    const slug = input.slug.trim().toLowerCase();
    const clash = await this.stagesRepo.exists({
      where: { organizationId, slug },
    });
    if (clash) {
      throw new ConflictException(
        `Admission stage with slug "${slug}" already exists`,
      );
    }

    let position = input.position;
    if (position === undefined) {
      const max = await this.stagesRepo
        .createQueryBuilder('s')
        .select('MAX(s.position)', 'max')
        .where('s.organization_id = :orgId', { orgId: organizationId })
        .getRawOne<{ max: number | null }>();
      position = (max?.max ?? -1) + 1;
    }

    if (input.isDefault) {
      await this.clearDefaultFlag(organizationId);
    }

    const stage = this.stagesRepo.create({
      ...input,
      slug,
      position,
      stageType: input.stageType ?? AdmissionStageType.IN_PROGRESS,
      isDefault: input.isDefault ?? false,
      organizationId,
    });
    return this.stagesRepo.save(stage);
  }

  async update(
    input: UpdateAdmissionStageInput,
    organizationId: string,
  ): Promise<AdmissionStage> {
    const stage = await this.findOne(input.id, organizationId);

    if (input.slug && input.slug !== stage.slug) {
      const slug = input.slug.trim().toLowerCase();
      const clash = await this.stagesRepo.exists({
        where: { organizationId, slug },
      });
      if (clash) {
        throw new ConflictException(
          `Admission stage with slug "${slug}" already exists`,
        );
      }
      stage.slug = slug;
    }

    if (input.isDefault === true && !stage.isDefault) {
      await this.clearDefaultFlag(organizationId);
      stage.isDefault = true;
    } else if (input.isDefault === false) {
      stage.isDefault = false;
    }

    const { id: _id, slug: _slug, isDefault: _isDefault, ...rest } = input;
    Object.assign(stage, rest);

    return this.stagesRepo.save(stage);
  }

  async archive(id: string, organizationId: string): Promise<boolean> {
    const stage = await this.findOne(id, organizationId);
    stage.isArchived = true;
    stage.isDefault = false;
    await this.stagesRepo.save(stage);
    return true;
  }

  async reorder(
    ids: string[],
    organizationId: string,
  ): Promise<AdmissionStage[]> {
    const stages = await this.stagesRepo.find({
      where: { id: In(ids), organizationId },
    });
    if (stages.length !== ids.length) {
      throw new NotFoundException(
        'One or more admission stages not found for this organization',
      );
    }
    const byId = new Map(stages.map((s) => [s.id, s]));
    const toSave = ids.map((id, index) => {
      const stage = byId.get(id)!;
      stage.position = index;
      return stage;
    });
    await this.stagesRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }

  private async clearDefaultFlag(organizationId: string): Promise<void> {
    await this.stagesRepo
      .createQueryBuilder()
      .update(AdmissionStage)
      .set({ isDefault: false })
      .where('organization_id = :orgId', { orgId: organizationId })
      .andWhere('is_default = true')
      .execute();
  }
}
