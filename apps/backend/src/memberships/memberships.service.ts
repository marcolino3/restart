import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { Repository } from 'typeorm';
import { CreateMembershipInput } from './dto/create-membership.input';
import { UpdateMembershipInput } from './dto/update-membership.input';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  async create(input: CreateMembershipInput): Promise<Membership> {
    const membership = new Membership({
      userId: input.userId,
      organizationId: input.organizationId,
      persona: input.persona,
      userEmailId: input.userEmailId,
      contactPhone: input.contactPhone,
    });
    return this.membershipRepository.save(membership);
  }

  async update(input: UpdateMembershipInput): Promise<Membership> {
    const { id, ...rest } = input;
    await this.membershipRepository.update({ id }, rest);
    const updated = await this.membershipRepository.findOne({
      where: { id },
      relations: ['userEmail'],
    });
    if (!updated) throw new NotFoundException('Membership not found');
    return updated;
  }

  async findByUserAndOrg(
    userId: string,
    organizationId: string,
  ): Promise<Membership[]> {
    return this.membershipRepository.find({
      where: { userId, organizationId },
      relations: ['userEmail'],
    });
  }

  async findByUserId(userId: string): Promise<Membership[]> {
    return this.membershipRepository.find({
      where: { userId },
      relations: ['userEmail', 'organization'],
    });
  }

  async findByOrgId(organizationId: string): Promise<Membership[]> {
    return this.membershipRepository.find({
      where: { organizationId },
      relations: ['user', 'userEmail', 'roles'],
    });
  }
}
