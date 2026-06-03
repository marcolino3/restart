import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdmissionRejectionReason } from './entities/admission-rejection-reason.entity';
import { CreateAdmissionRejectionReasonInput } from './dto/create-admission-rejection-reason.input';
import { UpdateAdmissionRejectionReasonInput } from './dto/update-admission-rejection-reason.input';

@Injectable()
export class AdmissionRejectionReasonsService {
  constructor(
    @InjectRepository(AdmissionRejectionReason)
    private readonly reasonsRepo: Repository<AdmissionRejectionReason>,
  ) {}

  async findAllByOrgId(
    organizationId: string,
    includeArchived = false,
  ): Promise<AdmissionRejectionReason[]> {
    return this.reasonsRepo.find({
      where: {
        organizationId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
  ): Promise<AdmissionRejectionReason> {
    const reason = await this.reasonsRepo.findOne({
      where: { id, organizationId },
    });
    if (!reason) {
      throw new NotFoundException(`Admission rejection reason ${id} not found`);
    }
    return reason;
  }

  async create(
    input: CreateAdmissionRejectionReasonInput,
    organizationId: string,
  ): Promise<AdmissionRejectionReason> {
    let position = input.position;
    if (position === undefined) {
      const max = await this.reasonsRepo
        .createQueryBuilder('r')
        .select('MAX(r.position)', 'max')
        .where('r.organization_id = :orgId', { orgId: organizationId })
        .getRawOne<{ max: number | null }>();
      position = (max?.max ?? -1) + 1;
    }

    const reason = this.reasonsRepo.create({
      ...input,
      position,
      organizationId,
    });
    return this.reasonsRepo.save(reason);
  }

  async update(
    input: UpdateAdmissionRejectionReasonInput,
    organizationId: string,
  ): Promise<AdmissionRejectionReason> {
    const reason = await this.findOne(input.id, organizationId);
    const { id: _id, ...rest } = input;
    Object.assign(reason, rest);
    return this.reasonsRepo.save(reason);
  }

  async archive(id: string, organizationId: string): Promise<boolean> {
    const reason = await this.findOne(id, organizationId);
    reason.isArchived = true;
    await this.reasonsRepo.save(reason);
    return true;
  }

  async reorder(
    ids: string[],
    organizationId: string,
  ): Promise<AdmissionRejectionReason[]> {
    const reasons = await this.reasonsRepo.find({
      where: { id: In(ids), organizationId },
    });
    if (reasons.length !== ids.length) {
      throw new NotFoundException(
        'One or more rejection reasons not found for this organization',
      );
    }
    const byId = new Map(reasons.map((r) => [r.id, r]));
    const toSave = ids.map((id, index) => {
      const reason = byId.get(id)!;
      reason.position = index;
      return reason;
    });
    await this.reasonsRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }
}
