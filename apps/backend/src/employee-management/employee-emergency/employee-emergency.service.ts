import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { EmployeeAuditLogService } from '../employee-audit-log/employee-audit-log.service';
import { EmployeeAuditLogEntityType } from '../employee-audit-log/entities/employee-audit-log.entity';
import { EmployeeEmergencyProfile } from './entities/employee-emergency-profile.entity';
import { UpsertEmployeeEmergencyProfileInput } from './dto/upsert-employee-emergency-profile.input';

/** Audit-Log-Felder sind text. Narrow auf primitive — die Entity-Spalten sind
 * varchar/enum/text, also string oder Date; alles andere via JSON.stringify. */
function toAuditString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

@Injectable()
export class EmployeeEmergencyService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly auditLogService: EmployeeAuditLogService,
  ) {}

  async findByEmployeeId(
    employeeId: string,
    organizationId: string,
  ): Promise<EmployeeEmergencyProfile | null> {
    return this.entityManager.findOne(EmployeeEmergencyProfile, {
      where: { employeeId, organizationId },
    });
  }

  async upsert(
    input: UpsertEmployeeEmergencyProfileInput,
    organizationId: string,
    actorMembershipId?: string | null,
  ): Promise<EmployeeEmergencyProfile> {
    return this.entityManager.transaction(async (m) => {
      const employee = await m.findOne(Employee, {
        where: { id: input.employeeId },
        relations: { membership: true },
      });
      if (!employee || employee.membership?.organizationId !== organizationId) {
        throw new NotFoundException('Employee not found');
      }

      let profile = await m.findOne(EmployeeEmergencyProfile, {
        where: { employeeId: input.employeeId, organizationId },
      });

      const changes: {
        fieldName: string;
        oldValue?: string | null;
        newValue?: string | null;
      }[] = [];

      const trackField = <K extends keyof EmployeeEmergencyProfile>(
        field: K,
        next: EmployeeEmergencyProfile[K] | null | undefined,
      ) => {
        if (next === undefined) return;
        const normalized =
          typeof next === 'string' ? next.trim() || null : (next ?? null);
        const current = profile ? (profile[field] ?? null) : null;
        if (current !== normalized) {
          changes.push({
            fieldName: field,
            oldValue: toAuditString(current),
            newValue: toAuditString(normalized),
          });
        }
      };

      trackField('contact1Name', input.contact1Name);
      trackField('contact1Relationship', input.contact1Relationship);
      trackField('contact1Phone', input.contact1Phone);
      trackField('contact1Email', input.contact1Email);
      trackField('contact2Name', input.contact2Name);
      trackField('contact2Relationship', input.contact2Relationship);
      trackField('contact2Phone', input.contact2Phone);
      trackField('contact2Email', input.contact2Email);
      trackField('bloodType', input.bloodType);
      trackField('allergies', input.allergies);
      trackField('chronicConditions', input.chronicConditions);
      trackField('emergencyMedications', input.emergencyMedications);
      trackField('primaryDoctorName', input.primaryDoctorName);
      trackField('primaryDoctorPhone', input.primaryDoctorPhone);
      trackField('pharmacyName', input.pharmacyName);

      const patch: Partial<EmployeeEmergencyProfile> = {
        employeeId: input.employeeId,
        organizationId,
        ...(input.contact1Name !== undefined && {
          contact1Name: input.contact1Name?.trim() || null,
        }),
        ...(input.contact1Relationship !== undefined && {
          contact1Relationship: input.contact1Relationship,
        }),
        ...(input.contact1Phone !== undefined && {
          contact1Phone: input.contact1Phone?.trim() || null,
        }),
        ...(input.contact1Email !== undefined && {
          contact1Email: input.contact1Email?.trim().toLowerCase() || null,
        }),
        ...(input.contact2Name !== undefined && {
          contact2Name: input.contact2Name?.trim() || null,
        }),
        ...(input.contact2Relationship !== undefined && {
          contact2Relationship: input.contact2Relationship,
        }),
        ...(input.contact2Phone !== undefined && {
          contact2Phone: input.contact2Phone?.trim() || null,
        }),
        ...(input.contact2Email !== undefined && {
          contact2Email: input.contact2Email?.trim().toLowerCase() || null,
        }),
        ...(input.bloodType !== undefined && { bloodType: input.bloodType }),
        ...(input.allergies !== undefined && {
          allergies: input.allergies?.trim() || null,
        }),
        ...(input.chronicConditions !== undefined && {
          chronicConditions: input.chronicConditions?.trim() || null,
        }),
        ...(input.emergencyMedications !== undefined && {
          emergencyMedications: input.emergencyMedications?.trim() || null,
        }),
        ...(input.primaryDoctorName !== undefined && {
          primaryDoctorName: input.primaryDoctorName?.trim() || null,
        }),
        ...(input.primaryDoctorPhone !== undefined && {
          primaryDoctorPhone: input.primaryDoctorPhone?.trim() || null,
        }),
        ...(input.pharmacyName !== undefined && {
          pharmacyName: input.pharmacyName?.trim() || null,
        }),
      };

      if (!profile) {
        profile = m.create(EmployeeEmergencyProfile, patch);
      } else {
        Object.assign(profile, patch);
      }
      profile = await m.save(EmployeeEmergencyProfile, profile);

      if (changes.length > 0) {
        await this.auditLogService.logChanges(
          input.employeeId,
          organizationId,
          actorMembershipId ?? null,
          changes.map((c) => ({
            entityType: EmployeeAuditLogEntityType.EMPLOYEE,
            fieldName: `emergency.${c.fieldName}`,
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
