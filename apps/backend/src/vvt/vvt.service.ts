import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessingActivity } from './entities/processing-activity.entity';
import { Subprocessor } from './entities/subprocessor.entity';
import { CreateProcessingActivityInput } from './dto/create-processing-activity.input';
import { UpdateProcessingActivityInput } from './dto/update-processing-activity.input';
import { CreateSubprocessorInput } from './dto/create-subprocessor.input';
import { UpdateSubprocessorInput } from './dto/update-subprocessor.input';

@Injectable()
export class VvtService {
  constructor(
    @InjectRepository(ProcessingActivity)
    private readonly activitiesRepo: Repository<ProcessingActivity>,
    @InjectRepository(Subprocessor)
    private readonly subprocessorsRepo: Repository<Subprocessor>,
  ) {}

  // --- Processing activities ---

  async listActivities(organizationId: string): Promise<ProcessingActivity[]> {
    return this.activitiesRepo.find({
      where: { organizationId, isArchived: false },
      order: { createdAt: 'ASC' },
    });
  }

  async createActivity(
    input: CreateProcessingActivityInput,
    organizationId: string,
  ): Promise<ProcessingActivity> {
    return this.activitiesRepo.save(
      this.activitiesRepo.create({ ...input, organizationId }),
    );
  }

  async updateActivity(
    input: UpdateProcessingActivityInput,
    organizationId: string,
  ): Promise<ProcessingActivity> {
    const activity = await this.activitiesRepo.findOne({
      where: { id: input.id, organizationId },
    });
    if (!activity) {
      throw new NotFoundException(`Processing activity ${input.id} not found`);
    }
    const { id: _id, ...rest } = input;
    Object.assign(activity, rest);
    return this.activitiesRepo.save(activity);
  }

  async archiveActivity(id: string, organizationId: string): Promise<boolean> {
    const activity = await this.activitiesRepo.findOne({
      where: { id, organizationId },
    });
    if (!activity) {
      throw new NotFoundException(`Processing activity ${id} not found`);
    }
    activity.isArchived = true;
    await this.activitiesRepo.save(activity);
    return true;
  }

  // --- Subprocessors ---

  async listSubprocessors(organizationId: string): Promise<Subprocessor[]> {
    return this.subprocessorsRepo.find({
      where: { organizationId, isArchived: false },
      order: { createdAt: 'ASC' },
    });
  }

  async createSubprocessor(
    input: CreateSubprocessorInput,
    organizationId: string,
  ): Promise<Subprocessor> {
    return this.subprocessorsRepo.save(
      this.subprocessorsRepo.create({ ...input, organizationId }),
    );
  }

  async updateSubprocessor(
    input: UpdateSubprocessorInput,
    organizationId: string,
  ): Promise<Subprocessor> {
    const subprocessor = await this.subprocessorsRepo.findOne({
      where: { id: input.id, organizationId },
    });
    if (!subprocessor) {
      throw new NotFoundException(`Subprocessor ${input.id} not found`);
    }
    const { id: _id, ...rest } = input;
    Object.assign(subprocessor, rest);
    return this.subprocessorsRepo.save(subprocessor);
  }

  async archiveSubprocessor(
    id: string,
    organizationId: string,
  ): Promise<boolean> {
    const subprocessor = await this.subprocessorsRepo.findOne({
      where: { id, organizationId },
    });
    if (!subprocessor) {
      throw new NotFoundException(`Subprocessor ${id} not found`);
    }
    subprocessor.isArchived = true;
    await this.subprocessorsRepo.save(subprocessor);
    return true;
  }
}
