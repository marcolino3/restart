import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, LessThan, Repository } from 'typeorm';
import { CreateAdmissionReminderInput } from './dto/create-admission-reminder.input';
import { UpdateAdmissionReminderInput } from './dto/update-admission-reminder.input';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionReminder } from './entities/admission-reminder.entity';
import { AdmissionReminderFilter } from './enums/admission-reminder-filter.enum';

@Injectable()
export class AdmissionRemindersService {
  constructor(
    @InjectRepository(AdmissionReminder)
    private readonly repo: Repository<AdmissionReminder>,
    @InjectRepository(AdmissionApplication)
    private readonly applicationsRepo: Repository<AdmissionApplication>,
  ) {}

  async findByApplication(
    applicationId: string,
    organizationId: string,
  ): Promise<AdmissionReminder[]> {
    const application = await this.applicationsRepo.findOne({
      where: { id: applicationId, organizationId },
      select: ['id'],
    });
    if (!application) {
      throw new NotFoundException(
        `Admission application ${applicationId} not found`,
      );
    }
    return this.repo.find({
      where: { applicationId, organizationId },
      relations: ['assignedToMembership', 'assignedToMembership.user'],
      order: { completedAt: 'ASC', dueAt: 'ASC' },
    });
  }

  async findForOrg(
    organizationId: string,
    filter: AdmissionReminderFilter,
  ): Promise<AdmissionReminder[]> {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const baseWhere: Record<string, unknown> = { organizationId };
    switch (filter) {
      case AdmissionReminderFilter.OVERDUE:
        baseWhere.completedAt = IsNull();
        baseWhere.dueAt = LessThan(startOfToday);
        break;
      case AdmissionReminderFilter.TODAY:
        baseWhere.completedAt = IsNull();
        baseWhere.dueAt = Between(startOfToday, endOfToday);
        break;
      case AdmissionReminderFilter.WEEK:
        baseWhere.completedAt = IsNull();
        baseWhere.dueAt = Between(startOfToday, endOfWeek);
        break;
      case AdmissionReminderFilter.OPEN:
        baseWhere.completedAt = IsNull();
        break;
      case AdmissionReminderFilter.COMPLETED:
        // Completed: completedAt is set — order DESC by completedAt below.
        break;
    }

    return this.repo.find({
      where: baseWhere,
      relations: [
        'application',
        'assignedToMembership',
        'assignedToMembership.user',
      ],
      order:
        filter === AdmissionReminderFilter.COMPLETED
          ? { completedAt: 'DESC' }
          : { dueAt: 'ASC' },
      take: 200,
    });
  }

  async create(
    input: CreateAdmissionReminderInput,
    organizationId: string,
    createdByMembershipId: string | null,
  ): Promise<AdmissionReminder> {
    const application = await this.applicationsRepo.findOne({
      where: { id: input.applicationId, organizationId },
      select: ['id'],
    });
    if (!application) {
      throw new NotFoundException(
        `Admission application ${input.applicationId} not found`,
      );
    }
    const entity = this.repo.create({
      organizationId,
      applicationId: input.applicationId,
      dueAt: new Date(input.dueAt),
      title: input.title.trim(),
      note: input.note?.trim() || null,
      assignedToMembershipId:
        input.assignedToMembershipId ?? createdByMembershipId ?? null,
      createdByMembershipId: createdByMembershipId ?? null,
    });
    return this.repo.save(entity);
  }

  async update(
    input: UpdateAdmissionReminderInput,
    organizationId: string,
  ): Promise<AdmissionReminder> {
    const existing = await this.repo.findOne({
      where: { id: input.id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException(`Reminder ${input.id} not found`);
    }
    if (input.dueAt !== undefined) existing.dueAt = new Date(input.dueAt);
    if (input.title !== undefined) existing.title = input.title.trim();
    if (input.note !== undefined) {
      existing.note = input.note?.toString().trim() || null;
    }
    if (input.assignedToMembershipId !== undefined) {
      existing.assignedToMembershipId = input.assignedToMembershipId ?? null;
    }
    return this.repo.save(existing);
  }

  async complete(
    id: string,
    organizationId: string,
    actorMembershipId: string | null,
  ): Promise<AdmissionReminder> {
    const reminder = await this.repo.findOne({
      where: { id, organizationId },
    });
    if (!reminder) throw new NotFoundException(`Reminder ${id} not found`);
    if (!reminder.completedAt) {
      reminder.completedAt = new Date();
      reminder.completedByMembershipId = actorMembershipId ?? null;
      await this.repo.save(reminder);
    }
    return reminder;
  }

  async uncomplete(
    id: string,
    organizationId: string,
  ): Promise<AdmissionReminder> {
    const reminder = await this.repo.findOne({
      where: { id, organizationId },
    });
    if (!reminder) throw new NotFoundException(`Reminder ${id} not found`);
    if (reminder.completedAt) {
      reminder.completedAt = null;
      reminder.completedByMembershipId = null;
      await this.repo.save(reminder);
    }
    return reminder;
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const existing = await this.repo.findOne({
      where: { id, organizationId },
      select: ['id'],
    });
    if (!existing) throw new NotFoundException(`Reminder ${id} not found`);
    await this.repo.delete({ id, organizationId });
    return true;
  }

  // Lightweight count per application — used by the kanban badge to avoid
  // fetching full reminder rows for every card.
  async countOpenByApplication(
    applicationIds: string[],
    organizationId: string,
  ): Promise<Map<string, { open: number; overdue: number }>> {
    const result = new Map<string, { open: number; overdue: number }>();
    if (applicationIds.length === 0) return result;
    const now = new Date();
    const rows = await this.repo
      .createQueryBuilder('r')
      .select('r.application_id', 'applicationId')
      .addSelect(
        'COUNT(*) FILTER (WHERE r.due_at < :now)::int',
        'overdueCount',
      )
      .addSelect('COUNT(*)::int', 'openCount')
      .where('r.organization_id = :organizationId', { organizationId })
      .andWhere('r.application_id IN (:...ids)', { ids: applicationIds })
      .andWhere('r.completed_at IS NULL')
      .setParameter('now', now)
      .groupBy('r.application_id')
      .getRawMany<{
        applicationId: string;
        overdueCount: number;
        openCount: number;
      }>();
    for (const row of rows) {
      result.set(row.applicationId, {
        open: row.openCount,
        overdue: row.overdueCount,
      });
    }
    return result;
  }
}
