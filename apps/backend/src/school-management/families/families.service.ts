import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { ContactPerson } from '../contact-persons/entities/contact-person.entity';
import { CreateFamilyInput } from './dto/create-family.input';
import { UpdateFamilyInput } from './dto/update-family.input';
import { Family } from './entities/family.entity';

@Injectable()
export class FamiliesService {
  constructor(
    @InjectRepository(Family)
    private readonly familyRepo: Repository<Family>,
    @InjectRepository(ContactPerson)
    private readonly contactRepo: Repository<ContactPerson>,
  ) {}

  async findAllByOrgId(
    organizationId: string,
    search?: string | null,
  ): Promise<Family[]> {
    const where = search?.trim()
      ? [{ organizationId, isArchived: false, name: ILike(`%${search}%`) }]
      : { organizationId, isArchived: false };
    return this.familyRepo.find({
      where,
      relations: ['primaryAddress'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Family> {
    const family = await this.familyRepo.findOne({
      where: { id, organizationId },
      relations: ['primaryAddress'],
    });
    if (!family) {
      throw new NotFoundException(`Family ${id} not found`);
    }
    return family;
  }

  async create(
    input: CreateFamilyInput,
    organizationId: string,
  ): Promise<Family> {
    const family = this.familyRepo.create({
      ...input,
      organizationId,
    });
    return this.familyRepo.save(family);
  }

  async update(
    input: UpdateFamilyInput,
    organizationId: string,
  ): Promise<Family> {
    const family = await this.findOne(input.id, organizationId);
    const { id: _id, ...rest } = input;
    Object.assign(family, rest);
    await this.familyRepo.save(family);
    return this.findOne(input.id, organizationId);
  }

  async archive(id: string, organizationId: string): Promise<boolean> {
    const family = await this.findOne(id, organizationId);
    family.isArchived = true;
    await this.familyRepo.save(family);
    return true;
  }

  async contactPersonsOfFamily(
    familyId: string,
    organizationId: string,
  ): Promise<ContactPerson[]> {
    return this.contactRepo.find({
      where: { familyId, organizationId, isArchived: false },
      relations: ['address'],
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }
}
