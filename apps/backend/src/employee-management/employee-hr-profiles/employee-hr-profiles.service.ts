import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { EmployeeAuditLogService } from '../employee-audit-log/employee-audit-log.service';
import { EmployeeAuditLogEntityType } from '../employee-audit-log/entities/employee-audit-log.entity';
import { EmployeeHrProfile } from './entities/employee-hr-profile.entity';
import { UpsertEmployeeHrProfileInput } from './dto/upsert-employee-hr-profile.input';

@Injectable()
export class EmployeeHrProfilesService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly auditLogService: EmployeeAuditLogService,
  ) {}

  async findByEmployeeId(
    employeeId: string,
    organizationId: string,
  ): Promise<EmployeeHrProfile | null> {
    return this.entityManager.findOne(EmployeeHrProfile, {
      where: { employeeId, organizationId },
    });
  }

  async upsert(
    input: UpsertEmployeeHrProfileInput,
    organizationId: string,
    actorMembershipId?: string | null,
  ): Promise<EmployeeHrProfile> {
    return this.entityManager.transaction(async (m) => {
      const employee = await m.findOne(Employee, {
        where: { id: input.employeeId },
        relations: { membership: true },
      });
      if (!employee || employee.membership?.organizationId !== organizationId) {
        throw new NotFoundException('Employee not found');
      }

      let profile = await m.findOne(EmployeeHrProfile, {
        where: { employeeId: input.employeeId, organizationId },
      });

      const changes: {
        fieldName: string;
        oldValue?: string | null;
        newValue?: string | null;
      }[] = [];

      const trackField = <K extends keyof EmployeeHrProfile>(
        field: K,
        next: EmployeeHrProfile[K] | null | undefined,
      ) => {
        if (next === undefined) return;
        const normalized =
          typeof next === 'string' ? next.trim() || null : (next ?? null);
        const current = profile ? (profile[field] ?? null) : null;
        if (current !== normalized) {
          changes.push({
            fieldName: field as string,
            oldValue: current == null ? null : String(current),
            newValue: normalized == null ? null : String(normalized),
          });
        }
      };

      trackField('iban', input.iban);
      trackField('bankAccountHolder', input.bankAccountHolder);
      trackField('bankName', input.bankName);
      trackField('bvgProvider', input.bvgProvider);
      trackField('bvgInsuranceNumber', input.bvgInsuranceNumber);
      trackField('uvgProvider', input.uvgProvider);
      trackField('withholdingTaxCode', input.withholdingTaxCode);
      trackField('nationality', input.nationality);
      trackField('residencePermitType', input.residencePermitType);
      trackField('residencePermitValidUntil', input.residencePermitValidUntil);
      trackField('maritalStatus', input.maritalStatus);
      trackField('denomination', input.denomination);
      trackField('numberOfChildren', input.numberOfChildren);
      trackField('onboardingStatus', input.onboardingStatus);
      trackField('ndaSigned', input.ndaSigned);
      trackField('criminalRecordSubmitted', input.criminalRecordSubmitted);

      const patch: Partial<EmployeeHrProfile> = {
        employeeId: input.employeeId,
        organizationId,
        ...(input.iban !== undefined && {
          iban: input.iban?.replace(/\s+/g, '').toUpperCase() || null,
        }),
        ...(input.bankAccountHolder !== undefined && {
          bankAccountHolder: input.bankAccountHolder?.trim() || null,
        }),
        ...(input.bankName !== undefined && {
          bankName: input.bankName?.trim() || null,
        }),
        ...(input.bvgProvider !== undefined && {
          bvgProvider: input.bvgProvider?.trim() || null,
        }),
        ...(input.bvgInsuranceNumber !== undefined && {
          bvgInsuranceNumber: input.bvgInsuranceNumber?.trim() || null,
        }),
        ...(input.uvgProvider !== undefined && {
          uvgProvider: input.uvgProvider?.trim() || null,
        }),
        ...(input.withholdingTaxCode !== undefined && {
          withholdingTaxCode:
            input.withholdingTaxCode?.trim().toUpperCase() || null,
        }),
        ...(input.nationality !== undefined && {
          nationality: input.nationality?.trim() || null,
        }),
        ...(input.residencePermitType !== undefined && {
          residencePermitType: input.residencePermitType,
        }),
        ...(input.residencePermitValidUntil !== undefined && {
          residencePermitValidUntil: input.residencePermitValidUntil || null,
        }),
        ...(input.maritalStatus !== undefined && {
          maritalStatus: input.maritalStatus,
        }),
        ...(input.denomination !== undefined && {
          denomination: input.denomination?.trim() || null,
        }),
        ...(input.numberOfChildren !== undefined && {
          numberOfChildren: input.numberOfChildren,
        }),
        ...(input.onboardingStatus !== undefined && {
          onboardingStatus: input.onboardingStatus,
        }),
        ...(input.ndaSigned !== undefined && { ndaSigned: input.ndaSigned }),
        ...(input.criminalRecordSubmitted !== undefined && {
          criminalRecordSubmitted: input.criminalRecordSubmitted,
        }),
      };

      if (!profile) {
        profile = m.create(EmployeeHrProfile, patch);
      } else {
        Object.assign(profile, patch);
      }
      profile = await m.save(EmployeeHrProfile, profile);

      if (changes.length > 0) {
        await this.auditLogService.logChanges(
          input.employeeId,
          organizationId,
          actorMembershipId ?? null,
          changes.map((c) => ({
            entityType: EmployeeAuditLogEntityType.EMPLOYEE,
            fieldName: `hr.${c.fieldName}`,
            oldValue: c.oldValue,
            newValue: c.newValue,
          })),
          m,
        );
      }

      return profile;
    });
  }
}
