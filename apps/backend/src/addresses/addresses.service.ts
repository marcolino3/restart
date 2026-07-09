import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressInput } from './dto/create-address.input';
import { UpdateAddressInput } from './dto/update-address.input';
import { applyScalarUpdate } from '@/database/apply-scalar-update';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
  ) {}

  async create(
    input: CreateAddressInput,
    organizationId: string,
  ): Promise<Address> {
    const { countryId, ...rest } = input;
    const address = this.addressRepo.create({
      ...rest,
      organizationId,
      ...(countryId ? { country: { id: countryId } } : {}),
    });
    const saved = await this.addressRepo.save(address);
    return this.findOne(saved.id, organizationId);
  }

  async findAllByOrgId(organizationId: string): Promise<Address[]> {
    return this.addressRepo.find({
      where: { organizationId, isArchived: false },
      relations: ['country'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Address> {
    const address = await this.addressRepo.findOne({
      where: { id, organizationId, isArchived: false },
      relations: ['country'],
    });
    if (!address) {
      throw new NotFoundException(`Address ${id} not found`);
    }
    return address;
  }

  async update(
    input: UpdateAddressInput,
    organizationId: string,
  ): Promise<Address> {
    const { id: _id, ...patch } = input;
    // Load WITHOUT the `country` relation so the assigned `countryId` wins on
    // save (a loaded relation object would silently revert the FK change).
    // Stays org-scoped for multi-tenant isolation.
    await applyScalarUpdate<Address>(
      this.addressRepo,
      { id: input.id, organizationId, isArchived: false },
      patch,
    );
    return this.findOne(input.id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const address = await this.findOne(id, organizationId);
    address.isArchived = true;
    await this.addressRepo.save(address);
    return true;
  }
}
