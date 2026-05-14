import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import { TimeTracking } from './entities/time-tracking.entity';
import { CreateTimeTrackingInput } from './dto/create-time-tracking.input';
import { UpdateTimeTrackingInput } from './dto/update-time-tracking.input';

@Injectable()
export class TimeTrackingService {
  constructor(
    @InjectRepository(TimeTracking)
    private readonly timeTrackingRepo: Repository<TimeTracking>,
  ) {}

  async create(
    input: CreateTimeTrackingInput,
    organizationId: string,
  ): Promise<TimeTracking> {
    const entry = this.timeTrackingRepo.create({
      ...input,
      startedAt: new Date(input.startedAt),
      endedAt: input.endedAt ? new Date(input.endedAt) : undefined,
      organizationId,
    });
    return this.timeTrackingRepo.save(entry);
  }

  async start(
    employeeId: string,
    organizationId: string,
  ): Promise<TimeTracking> {
    const openEntry = await this.timeTrackingRepo.findOne({
      where: {
        organizationId,
        employeeId,
        endedAt: IsNull(),
        isActive: true,
      },
    });
    if (openEntry) {
      throw new BadRequestException(
        'An open time tracking entry already exists for this employee',
      );
    }

    const entry = this.timeTrackingRepo.create({
      organizationId,
      employeeId,
      startedAt: new Date(),
    });
    return this.timeTrackingRepo.save(entry);
  }

  async stop(
    employeeId: string,
    organizationId: string,
  ): Promise<TimeTracking> {
    const openEntry = await this.timeTrackingRepo.findOne({
      where: {
        organizationId,
        employeeId,
        endedAt: IsNull(),
        isActive: true,
      },
    });
    if (!openEntry) {
      throw new NotFoundException(
        'No open time tracking entry found for this employee',
      );
    }
    openEntry.endedAt = new Date();
    return this.timeTrackingRepo.save(openEntry);
  }

  async findAllByEmployeeId(
    employeeId: string,
    organizationId: string,
    from?: Date,
    to?: Date,
  ): Promise<TimeTracking[]> {
    return this.timeTrackingRepo.find({
      where: {
        organizationId,
        employeeId,
        isActive: true,
        ...(from && to ? { startedAt: Between(from, to) } : {}),
      },
      order: { startedAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<TimeTracking> {
    const entry = await this.timeTrackingRepo.findOne({
      where: { id, organizationId, isActive: true },
      relations: ['employee'],
    });
    if (!entry) {
      throw new NotFoundException(`TimeTracking entry ${id} not found`);
    }
    return entry;
  }

  async update(
    input: UpdateTimeTrackingInput,
    organizationId: string,
  ): Promise<TimeTracking> {
    const entry = await this.findOne(input.id, organizationId);
    const { startedAt, endedAt, ...rest } = input;
    Object.assign(entry, rest);
    if (startedAt) entry.startedAt = new Date(startedAt);
    if (endedAt !== undefined) {
      entry.endedAt = endedAt ? new Date(endedAt) : undefined;
    }
    return this.timeTrackingRepo.save(entry);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const entry = await this.findOne(id, organizationId);
    entry.isActive = false;
    await this.timeTrackingRepo.save(entry);
    return true;
  }
}
