import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyVacationAssignment } from './entities/company-vacation-assignment.entity';
import { CompanyVacation } from '@/employee-management/company-vacations/entities/company-vacation.entity';

@Injectable()
export class CompanyVacationAssignmentsService {
  constructor(
    @InjectRepository(CompanyVacationAssignment)
    private readonly assignmentRepo: Repository<CompanyVacationAssignment>,
    @InjectRepository(CompanyVacation)
    private readonly companyVacationRepo: Repository<CompanyVacation>,
  ) {}

  async assign(
    companyVacationId: string,
    employeeId: string,
    organizationId: string,
  ): Promise<CompanyVacationAssignment> {
    const vacation = await this.companyVacationRepo.findOne({
      where: { id: companyVacationId, organizationId },
    });
    if (!vacation) {
      throw new NotFoundException(
        `CompanyVacation ${companyVacationId} not found`,
      );
    }

    const existing = await this.assignmentRepo.findOne({
      where: { organizationId, companyVacationId, employeeId },
    });
    if (existing) return existing;

    const assignment = this.assignmentRepo.create({
      organizationId,
      companyVacationId,
      employeeId,
    });
    return this.assignmentRepo.save(assignment);
  }

  async unassign(
    companyVacationId: string,
    employeeId: string,
    organizationId: string,
  ): Promise<boolean> {
    const result = await this.assignmentRepo.delete({
      organizationId,
      companyVacationId,
      employeeId,
    });
    return (result.affected ?? 0) > 0;
  }

  async findForEmployee(
    employeeId: string,
    organizationId: string,
  ): Promise<CompanyVacation[]> {
    const [appliesToAll, assigned] = await Promise.all([
      this.companyVacationRepo.find({
        where: { organizationId, appliesToAll: true },
      }),
      this.assignmentRepo.find({
        where: { organizationId, employeeId },
        relations: { companyVacation: true },
      }),
    ]);

    const byId = new Map<string, CompanyVacation>();
    for (const vacation of appliesToAll) byId.set(vacation.id, vacation);
    for (const link of assigned)
      byId.set(link.companyVacationId, link.companyVacation);

    return [...byId.values()].sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );
  }
}
