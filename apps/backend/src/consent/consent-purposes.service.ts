import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConsentPurpose } from './entities/consent-purpose.entity';
import { CreateConsentPurposeInput } from './dto/create-consent-purpose.input';
import { UpdateConsentPurposeInput } from './dto/update-consent-purpose.input';
import { ConsentLegalBasis } from './enums/consent-legal-basis.enum';

@Injectable()
export class ConsentPurposesService {
  constructor(
    @InjectRepository(ConsentPurpose)
    private readonly purposesRepo: Repository<ConsentPurpose>,
  ) {}

  async findAllByOrgId(
    organizationId: string,
    includeArchived = false,
  ): Promise<ConsentPurpose[]> {
    return this.purposesRepo.find({
      where: {
        organizationId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<ConsentPurpose> {
    const purpose = await this.purposesRepo.findOne({
      where: { id, organizationId },
    });
    if (!purpose) {
      throw new NotFoundException(`Consent purpose ${id} not found`);
    }
    return purpose;
  }

  async create(
    input: CreateConsentPurposeInput,
    organizationId: string,
  ): Promise<ConsentPurpose> {
    const slug = input.slug.trim().toLowerCase();
    const clash = await this.purposesRepo.exists({
      where: { organizationId, slug },
    });
    if (clash) {
      throw new ConflictException(
        `Consent purpose with slug "${slug}" already exists`,
      );
    }

    let position = input.position;
    if (position === undefined) {
      const max = await this.purposesRepo
        .createQueryBuilder('p')
        .select('MAX(p.position)', 'max')
        .where('p.organization_id = :orgId', { orgId: organizationId })
        .getRawOne<{ max: number | null }>();
      position = (max?.max ?? -1) + 1;
    }

    const purpose = this.purposesRepo.create({
      ...input,
      slug,
      position,
      legalBasis: input.legalBasis ?? ConsentLegalBasis.CONSENT,
      requiresEvidence: input.requiresEvidence ?? false,
      isMandatory: input.isMandatory ?? false,
      organizationId,
    });
    return this.purposesRepo.save(purpose);
  }

  async update(
    input: UpdateConsentPurposeInput,
    organizationId: string,
  ): Promise<ConsentPurpose> {
    const purpose = await this.findOne(input.id, organizationId);

    if (input.slug && input.slug !== purpose.slug) {
      const slug = input.slug.trim().toLowerCase();
      const clash = await this.purposesRepo.exists({
        where: { organizationId, slug },
      });
      if (clash) {
        throw new ConflictException(
          `Consent purpose with slug "${slug}" already exists`,
        );
      }
      purpose.slug = slug;
    }

    const { id: _id, slug: _slug, ...rest } = input;
    Object.assign(purpose, rest);

    return this.purposesRepo.save(purpose);
  }

  async archive(id: string, organizationId: string): Promise<boolean> {
    const purpose = await this.findOne(id, organizationId);
    purpose.isArchived = true;
    await this.purposesRepo.save(purpose);
    return true;
  }

  async reorder(
    ids: string[],
    organizationId: string,
  ): Promise<ConsentPurpose[]> {
    const purposes = await this.purposesRepo.find({
      where: { id: In(ids), organizationId },
    });
    if (purposes.length !== ids.length) {
      throw new NotFoundException(
        'One or more consent purposes not found for this organization',
      );
    }
    const byId = new Map(purposes.map((p) => [p.id, p]));
    const toSave = ids.map((id, index) => {
      const purpose = byId.get(id)!;
      purpose.position = index;
      return purpose;
    });
    await this.purposesRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }
}
