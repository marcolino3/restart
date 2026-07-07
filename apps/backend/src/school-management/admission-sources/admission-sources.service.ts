import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { AdmissionSource } from './entities/admission-source.entity';
import { CreateAdmissionSourceInput } from './dto/create-admission-source.input';
import { UpdateAdmissionSourceInput } from './dto/update-admission-source.input';

const DEFAULT_SOURCES: Array<
  Pick<AdmissionSource, 'systemKey' | 'name' | 'position'>
> = [
  { systemKey: 'MANUAL', name: 'Manuell erfasst', position: 0 },
  { systemKey: 'PUBLIC_FORM', name: 'Online-Formular', position: 1 },
  { systemKey: 'OPEN_DAY', name: 'Tag der offenen Tür', position: 2 },
  { systemKey: 'REFERRAL', name: 'Empfehlung', position: 3 },
  { systemKey: 'OTHER', name: 'Sonstiges', position: 4 },
];

@Injectable()
export class AdmissionSourcesService {
  constructor(
    @InjectRepository(AdmissionSource)
    private readonly sourcesRepo: Repository<AdmissionSource>,
  ) {}

  async findAllByOrgId(
    organizationId: string,
    includeArchived = false,
  ): Promise<AdmissionSource[]> {
    return this.sourcesRepo.find({
      where: {
        organizationId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<AdmissionSource> {
    const source = await this.sourcesRepo.findOne({
      where: { id, organizationId },
    });
    if (!source) {
      throw new NotFoundException(`Admission source ${id} not found`);
    }
    return source;
  }

  async create(
    input: CreateAdmissionSourceInput,
    organizationId: string,
  ): Promise<AdmissionSource> {
    let position = input.position;
    if (position === undefined) {
      const max = await this.sourcesRepo
        .createQueryBuilder('s')
        .select('MAX(s.position)', 'max')
        .where('s.organization_id = :orgId', { orgId: organizationId })
        .getRawOne<{ max: number | null }>();
      position = (max?.max ?? -1) + 1;
    }

    const source = this.sourcesRepo.create({
      ...input,
      position,
      organizationId,
    });
    return this.sourcesRepo.save(source);
  }

  async update(
    input: UpdateAdmissionSourceInput,
    organizationId: string,
  ): Promise<AdmissionSource> {
    const source = await this.findOne(input.id, organizationId);
    const { id: _id, ...rest } = input;
    Object.assign(source, rest);
    return this.sourcesRepo.save(source);
  }

  async archive(id: string, organizationId: string): Promise<boolean> {
    const source = await this.findOne(id, organizationId);
    source.isArchived = true;
    await this.sourcesRepo.save(source);
    return true;
  }

  async reorder(
    ids: string[],
    organizationId: string,
  ): Promise<AdmissionSource[]> {
    const sources = await this.sourcesRepo.find({
      where: { id: In(ids), organizationId },
    });
    if (sources.length !== ids.length) {
      throw new NotFoundException(
        'One or more admission sources not found for this organization',
      );
    }
    const byId = new Map(sources.map((s) => [s.id, s]));
    const toSave = ids.map((id, index) => {
      const source = byId.get(id)!;
      source.position = index;
      return source;
    });
    await this.sourcesRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }

  /**
   * Seeds the five default admission sources for an organization if it does
   * not have any sources yet. Idempotent — existing orgs are left untouched.
   */
  async seedDefaults(
    organizationId: string,
    manager?: EntityManager,
  ): Promise<AdmissionSource[]> {
    const repo = manager
      ? manager.getRepository(AdmissionSource)
      : this.sourcesRepo;

    const existingCount = await repo.count({ where: { organizationId } });
    if (existingCount > 0) {
      return [];
    }

    const sources = DEFAULT_SOURCES.map((defaults) =>
      repo.create({
        ...defaults,
        color: null,
        organizationId,
      }),
    );
    return repo.save(sources);
  }
}
