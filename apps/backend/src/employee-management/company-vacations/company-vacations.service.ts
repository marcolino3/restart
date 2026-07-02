import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyVacation } from './entities/company-vacation.entity';
import { CreateCompanyVacationInput } from './dto/create-company-vacation.input';
import { UpdateCompanyVacationInput } from './dto/update-company-vacation.input';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';

@Injectable()
export class CompanyVacationsService {
  constructor(
    @InjectRepository(CompanyVacation)
    private readonly repo: Repository<CompanyVacation>,
    private readonly balanceRecompute: BalanceRecomputeService,
  ) {}

  findAll(organizationId: string): Promise<CompanyVacation[]> {
    return this.repo.find({
      where: { organizationId, isActive: true },
      order: { startDate: 'ASC' },
    });
  }

  async create(
    input: CreateCompanyVacationInput,
    organizationId: string,
  ): Promise<CompanyVacation> {
    const entity = this.repo.create({
      ...input,
      appliesToAll: input.appliesToAll ?? true,
      organizationId,
    });
    const saved = await this.repo.save(entity);
    await this.balanceRecompute.recomputeOrgRange(
      organizationId,
      saved.startDate,
      saved.endDate,
    );
    return saved;
  }

  async update(
    input: UpdateCompanyVacationInput,
    organizationId: string,
  ): Promise<CompanyVacation> {
    const entity = await this.findOne(input.id, organizationId);
    const prevStart = entity.startDate;
    const prevEnd = entity.endDate;
    const { id: _id, ...rest } = input;
    Object.assign(entity, rest);
    const saved = await this.repo.save(entity);
    // Sowohl alten als auch neuen Bereich neu rechnen.
    const from = prevStart < saved.startDate ? prevStart : saved.startDate;
    const to = prevEnd > saved.endDate ? prevEnd : saved.endDate;
    await this.balanceRecompute.recomputeOrgRange(organizationId, from, to);
    return saved;
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const entity = await this.findOne(id, organizationId);
    entity.isActive = false;
    await this.repo.save(entity);
    await this.balanceRecompute.recomputeOrgRange(
      organizationId,
      entity.startDate,
      entity.endDate,
    );
    return true;
  }

  private async findOne(
    id: string,
    organizationId: string,
  ): Promise<CompanyVacation> {
    const entity = await this.repo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!entity) throw new NotFoundException(`CompanyVacation ${id} not found`);
    return entity;
  }
}
