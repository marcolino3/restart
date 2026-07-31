import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  SetupStatus,
  SetupStep,
  SetupStepKey,
} from './dto/setup-status.output';

interface RawCounts {
  org_configured: string;
  grade_levels: string;
  school_classes: string;
  employees: string;
  curricula: string;
  stages_without_cycle: string;
  stages_total: string;
  students: string;
  email_settings: string;
  holidays: string;
}

@Injectable()
export class SetupStatusService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Which parts of the initial setup are still missing for an organisation.
   *
   * A fresh org already gets roles, permissions, absence categories and
   * admission stages from the seeders in OrganizationsService.create — but no
   * stages, classes, staff, curriculum or students. Until those exist the app
   * shows empty dashboards with no hint of what to do, which is what this
   * drives.
   *
   * Deliberately one round trip: nine separate counts would be nine queries on
   * every dashboard render.
   */
  async getStatus(organizationId: string): Promise<SetupStatus> {
    // Column naming is mixed in this schema — "isActive" is camelCase and
    // quoted, "organization_id" is snake_case. Employees carry no org column
    // at all; they hang off the org through memberships.
    const raw = await this.dataSource.query<RawCounts[]>(
      `
      SELECT
        (SELECT COUNT(*) FROM organizations
           WHERE id = $1 AND name IS NOT NULL AND name <> '')       AS org_configured,
        (SELECT COUNT(*) FROM grade_levels
           WHERE organization_id = $1 AND "isActive" = true)        AS grade_levels,
        (SELECT COUNT(*) FROM school_classes
           WHERE organization_id = $1 AND "isActive" = true)        AS school_classes,
        (SELECT COUNT(*) FROM memberships m
           JOIN employees e ON e.id = m.employee_id
           WHERE m.organization_id = $1 AND m."isActive" = true)    AS employees,
        (SELECT COUNT(*) FROM curricula
           WHERE organization_id = $1 AND "isActive" = true)        AS curricula,
        (SELECT COUNT(*) FROM grade_levels
           WHERE organization_id = $1 AND "isActive" = true
             AND curriculum_level_id IS NULL)                       AS stages_without_cycle,
        (SELECT COUNT(*) FROM grade_levels
           WHERE organization_id = $1 AND "isActive" = true)        AS stages_total,
        (SELECT COUNT(*) FROM students
           WHERE organization_id = $1 AND "isActive" = true)        AS students,
        (SELECT COUNT(*) FROM organization_settings
           WHERE "organizationId" = $1)                             AS email_settings,
        (SELECT COUNT(*) FROM holidays
           WHERE organization_id = $1)                              AS holidays
      `,
      [organizationId],
    );

    const c = raw[0];
    const n = (v: string | undefined) => Number(v ?? 0);

    const stagesTotal = n(c?.stages_total);
    const stagesWithoutCycle = n(c?.stages_without_cycle);
    // Only meaningful once stages and a curriculum exist; before that the step
    // is not "failed", it is simply not reachable yet.
    const cycleLinkDone =
      stagesTotal > 0 && n(c?.curricula) > 0 && stagesWithoutCycle === 0;

    const steps: SetupStep[] = [
      {
        key: SetupStepKey.ORGANIZATION,
        done: n(c?.org_configured) > 0,
        required: true,
        count: n(c?.org_configured),
      },
      {
        key: SetupStepKey.GRADE_LEVELS,
        done: stagesTotal > 0,
        required: true,
        count: stagesTotal,
      },
      {
        key: SetupStepKey.SCHOOL_CLASSES,
        done: n(c?.school_classes) > 0,
        required: true,
        count: n(c?.school_classes),
      },
      {
        key: SetupStepKey.EMPLOYEES,
        done: n(c?.employees) > 0,
        required: true,
        count: n(c?.employees),
      },
      {
        key: SetupStepKey.CURRICULUM,
        done: n(c?.curricula) > 0,
        required: true,
        count: n(c?.curricula),
      },
      {
        key: SetupStepKey.CURRICULUM_CYCLE_LINK,
        done: cycleLinkDone,
        required: true,
        // Stages still missing a cycle — the number the admin has to work off.
        count: stagesWithoutCycle,
      },
      {
        key: SetupStepKey.STUDENTS,
        done: n(c?.students) > 0,
        required: true,
        count: n(c?.students),
      },
      {
        key: SetupStepKey.EMAIL,
        done: n(c?.email_settings) > 0,
        required: false,
        count: n(c?.email_settings),
      },
      {
        key: SetupStepKey.TIME_TRACKING,
        done: n(c?.holidays) > 0,
        required: false,
        count: n(c?.holidays),
      },
    ];

    const requiredRemaining = steps.filter((s) => s.required && !s.done).length;

    return {
      complete: requiredRemaining === 0,
      requiredRemaining,
      steps,
    };
  }
}
