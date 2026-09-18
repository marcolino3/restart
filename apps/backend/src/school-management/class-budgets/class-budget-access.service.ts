import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { PermissionCode } from '@/permissions/entities/permission-code.enum';
import { SchoolClassesService } from '@/school-management/school-classes/school-classes.service';
import { SchoolYearRange } from '@/school-management/school-classes/lib/school-year';
import { Injectable, NotFoundException } from '@nestjs/common';

/**
 * Single place that decides which classes a caller may see/touch in the
 * budget module.
 *
 * Two layers, both always applied:
 *   1. Tenant: every lookup is scoped to the caller's active organization.
 *   2. Class: non-managers only reach classes they currently teach — the same
 *      rule as `SchoolClassesService.findVisibleToUser` (heatmap, students).
 *
 * A class outside either layer is reported as NotFound, so ids of foreign
 * orgs / foreign classes are indistinguishable from non-existent ones.
 */
@Injectable()
export class ClassBudgetAccessService {
  constructor(private readonly schoolClassesService: SchoolClassesService) {}

  /** Managers set budgets, maintain categories and edit any expense. */
  canManage(user: TokenPayload): boolean {
    return (
      user.isSuperAdmin === true ||
      (user.permissions ?? []).includes(PermissionCode.CLASS_BUDGET_MANAGE)
    );
  }

  async visibleSchoolClassIds(
    organizationId: string,
    user: TokenPayload,
  ): Promise<string[]> {
    const classes = await this.schoolClassesService.findVisibleToUser(
      organizationId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
    );
    return classes.map((schoolClass) => schoolClass.id);
  }

  async assertSchoolClassAccessible(
    schoolClassId: string,
    organizationId: string,
    user: TokenPayload,
  ): Promise<void> {
    const visible = await this.visibleSchoolClassIds(organizationId, user);
    if (!visible.includes(schoolClassId)) {
      throw new NotFoundException(`School class ${schoolClassId} not found`);
    }
  }

  /**
   * The org's school year that starts in calendar year `startYear`.
   * 31 December lies on or after every possible cut-off of its calendar year,
   * so it always resolves to the school year that started in `startYear`.
   */
  schoolYearStarting(
    organizationId: string,
    startYear: number,
  ): Promise<SchoolYearRange> {
    return this.schoolClassesService.schoolYearOf(
      organizationId,
      `${startYear}-12-31`,
    );
  }

  currentSchoolYear(organizationId: string): Promise<SchoolYearRange> {
    return this.schoolClassesService.schoolYearOf(organizationId);
  }
}
