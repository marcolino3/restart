import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { UpdateOrganizationInput } from '@/organizations/dto/update-organization.input';
import { Organization } from '@/organizations/entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(private readonly entityManager: EntityManager) {}

  async create(): Promise<Organization> {
    const organization = this.entityManager.create(Organization);
    return this.entityManager.save(organization);
  }

  findAll() {
    return `This action returns all organizations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} organization`;
  }

  update(updateOrganizationInput: UpdateOrganizationInput) {
    console.log(updateOrganizationInput);
    return `This action updates a  organization`;
  }

  remove(id: number) {
    return `This action removes a #${id} organization`;
  }
}
