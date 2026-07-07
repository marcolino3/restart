import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdmissionAppointmentType } from './entities/admission-appointment-type.entity';
import { CreateAdmissionAppointmentTypeInput } from './dto/create-admission-appointment-type.input';
import { UpdateAdmissionAppointmentTypeInput } from './dto/update-admission-appointment-type.input';

@Injectable()
export class AdmissionAppointmentTypesService {
  constructor(
    @InjectRepository(AdmissionAppointmentType)
    private readonly typesRepo: Repository<AdmissionAppointmentType>,
  ) {}

  async findAllByOrgId(
    organizationId: string,
    includeArchived = false,
  ): Promise<AdmissionAppointmentType[]> {
    return this.typesRepo.find({
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
  ): Promise<AdmissionAppointmentType> {
    const type = await this.typesRepo.findOne({
      where: { id, organizationId },
    });
    if (!type) {
      throw new NotFoundException(`Admission appointment type ${id} not found`);
    }
    return type;
  }

  async create(
    input: CreateAdmissionAppointmentTypeInput,
    organizationId: string,
  ): Promise<AdmissionAppointmentType> {
    let position = input.position;
    if (position === undefined) {
      const max = await this.typesRepo
        .createQueryBuilder('t')
        .select('MAX(t.position)', 'max')
        .where('t.organization_id = :orgId', { orgId: organizationId })
        .getRawOne<{ max: number | null }>();
      position = (max?.max ?? -1) + 1;
    }

    const type = this.typesRepo.create({
      ...input,
      position,
      organizationId,
    });
    return this.typesRepo.save(type);
  }

  async update(
    input: UpdateAdmissionAppointmentTypeInput,
    organizationId: string,
  ): Promise<AdmissionAppointmentType> {
    const type = await this.findOne(input.id, organizationId);
    const { id: _id, ...rest } = input;
    Object.assign(type, rest);
    return this.typesRepo.save(type);
  }

  async archive(id: string, organizationId: string): Promise<boolean> {
    const type = await this.findOne(id, organizationId);
    type.isArchived = true;
    await this.typesRepo.save(type);
    return true;
  }

  async reorder(
    ids: string[],
    organizationId: string,
  ): Promise<AdmissionAppointmentType[]> {
    const types = await this.typesRepo.find({
      where: { id: In(ids), organizationId },
    });
    if (types.length !== ids.length) {
      throw new NotFoundException(
        'One or more appointment types not found for this organization',
      );
    }
    const byId = new Map(types.map((t) => [t.id, t]));
    const toSave = ids.map((id, index) => {
      const type = byId.get(id)!;
      type.position = index;
      return type;
    });
    await this.typesRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }
}
