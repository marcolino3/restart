import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GradeLevel } from './entities/grade-level.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { CreateGradeLevelInput } from './dto/create-grade-level.input';
import { UpdateGradeLevelInput } from './dto/update-grade-level.input';
import { ReorderGradeLevelsInput } from './dto/reorder-grade-levels.input';

@Injectable()
export class GradeLevelsService {
  constructor(
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepo: Repository<GradeLevel>,
    @InjectRepository(SchoolClass)
    private readonly schoolClassRepo: Repository<SchoolClass>,
  ) {}

  private assertValidAgeRange(
    ageMin?: number | null,
    ageMax?: number | null,
  ): void {
    if (ageMin != null && ageMax != null && ageMax < ageMin) {
      throw new BadRequestException('ageMax must not be smaller than ageMin');
    }
  }

  /**
   * Validates a requested parent: it must exist in the same org and itself be a
   * top-level Stufe (nesting is limited to a single level). Pass `selfId` on
   * update to reject a level pointing at itself.
   */
  private async assertValidParent(
    parentId: string | null | undefined,
    organizationId: string,
    selfId?: string,
  ): Promise<void> {
    if (parentId == null) return;
    if (selfId && parentId === selfId) {
      throw new BadRequestException('A grade level cannot be its own parent');
    }
    const parent = await this.gradeLevelRepo.findOne({
      where: { id: parentId, organizationId, isActive: true },
    });
    if (!parent) {
      throw new NotFoundException(
        `Parent grade level ${parentId} not found in this organization`,
      );
    }
    if (parent.parentId != null) {
      throw new BadRequestException(
        'Subgroups can only be nested one level deep',
      );
    }
  }

  /** A level that already has subgroups may not itself become a subgroup. */
  private async assertHasNoChildren(
    id: string,
    organizationId: string,
  ): Promise<void> {
    const childCount = await this.gradeLevelRepo.count({
      where: { parentId: id, organizationId, isActive: true },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        'A grade level with subgroups cannot become a subgroup itself',
      );
    }
  }

  async create(
    input: CreateGradeLevelInput,
    organizationId: string,
  ): Promise<GradeLevel> {
    this.assertValidAgeRange(input.ageMin, input.ageMax);
    await this.assertValidParent(input.parentId, organizationId);
    const existing = await this.gradeLevelRepo.findOne({
      where: { organizationId, name: input.name },
    });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.parentId = input.parentId ?? null;
        return this.gradeLevelRepo.save(existing);
      }
      throw new ConflictException(`Grade level "${input.name}" already exists`);
    }

    const gradeLevel = this.gradeLevelRepo.create({
      ...input,
      parentId: input.parentId ?? null,
      organizationId,
    });
    return this.gradeLevelRepo.save(gradeLevel);
  }

  async findAllByOrgId(organizationId: string): Promise<GradeLevel[]> {
    const levels = await this.gradeLevelRepo.find({
      where: { organizationId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    if (levels.length === 0) return levels;

    const ids = levels.map((l) => l.id);

    const classRows: Array<{ gl_id: string; class_count: string }> =
      await this.schoolClassRepo
        .createQueryBuilder('sc')
        .innerJoin('sc.gradeLevels', 'gl')
        .select('gl.id', 'gl_id')
        .addSelect('COUNT(DISTINCT sc.id)', 'class_count')
        .where('sc.organizationId = :organizationId', { organizationId })
        .andWhere('sc.isActive = true')
        .andWhere('gl.id IN (:...ids)', { ids })
        .groupBy('gl.id')
        .getRawMany();

    const studentRows: Array<{ gl_id: string; student_count: string }> =
      await this.schoolClassRepo
        .createQueryBuilder('sc')
        .innerJoin('sc.gradeLevels', 'gl')
        .innerJoin(
          'school_class_enrollments',
          'e',
          'e.school_class_id = sc.id AND e.left_at IS NULL AND e."isActive" = true',
        )
        .select('gl.id', 'gl_id')
        .addSelect('COUNT(DISTINCT e.student_id)', 'student_count')
        .where('sc.organizationId = :organizationId', { organizationId })
        .andWhere('sc.isActive = true')
        .andWhere('gl.id IN (:...ids)', { ids })
        .groupBy('gl.id')
        .getRawMany();

    const classCounts = new Map(
      classRows.map((r) => [r.gl_id, Number(r.class_count)]),
    );
    const studentCounts = new Map(
      studentRows.map((r) => [r.gl_id, Number(r.student_count)]),
    );

    return levels.map((level) => {
      level.classCount = classCounts.get(level.id) ?? 0;
      level.studentCount = studentCounts.get(level.id) ?? 0;
      return level;
    });
  }

  async findOne(id: string, organizationId: string): Promise<GradeLevel> {
    const gradeLevel = await this.gradeLevelRepo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!gradeLevel) {
      throw new NotFoundException(`GradeLevel ${id} not found`);
    }
    return gradeLevel;
  }

  async update(
    input: UpdateGradeLevelInput,
    organizationId: string,
  ): Promise<GradeLevel> {
    const gradeLevel = await this.findOne(input.id, organizationId);
    this.assertValidAgeRange(
      input.ageMin !== undefined ? input.ageMin : gradeLevel.ageMin,
      input.ageMax !== undefined ? input.ageMax : gradeLevel.ageMax,
    );

    // Re-parenting is opt-in: `parentId === undefined` leaves the hierarchy
    // untouched, `null` promotes to top level, a UUID nests as a subgroup.
    const { parentId, id: _id, ...rest } = input;
    if (parentId !== undefined) {
      const nextParent = parentId ?? null;
      if (nextParent != null) {
        await this.assertHasNoChildren(gradeLevel.id, organizationId);
        await this.assertValidParent(nextParent, organizationId, gradeLevel.id);
      }
      gradeLevel.parentId = nextParent;
    }

    Object.assign(gradeLevel, rest);
    return this.gradeLevelRepo.save(gradeLevel);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const gradeLevel = await this.findOne(id, organizationId);

    const usageCount = await this.schoolClassRepo
      .createQueryBuilder('sc')
      .innerJoin('sc.gradeLevels', 'gl', 'gl.id = :glId', { glId: id })
      .where('sc.organizationId = :organizationId', { organizationId })
      .andWhere('sc.isActive = true')
      .getCount();

    if (usageCount > 0) {
      throw new ConflictException(
        `Grade level "${gradeLevel.name}" is assigned to ${usageCount} class(es) and cannot be deleted`,
      );
    }

    // Lift any subgroups up to top level so they are not orphaned/hidden when
    // their parent Stufe is removed (mirrors the Team hierarchy child-lifting).
    await this.gradeLevelRepo.update(
      { parentId: id, organizationId },
      { parentId: null },
    );

    gradeLevel.isActive = false;
    await this.gradeLevelRepo.save(gradeLevel);
    return true;
  }

  async reorder(
    input: ReorderGradeLevelsInput,
    organizationId: string,
  ): Promise<GradeLevel[]> {
    const levels = await this.gradeLevelRepo.find({
      where: { id: In(input.ids), organizationId, isActive: true },
    });
    if (levels.length !== input.ids.length) {
      throw new NotFoundException(
        'One or more grade levels not found in this organization',
      );
    }

    const reparent = input.parentId !== undefined;
    const nextParent = input.parentId ?? null;
    if (reparent && nextParent != null) {
      if (input.ids.includes(nextParent)) {
        throw new BadRequestException('A grade level cannot be its own parent');
      }
      await this.assertValidParent(nextParent, organizationId);
      for (const level of levels) {
        await this.assertHasNoChildren(level.id, organizationId);
      }
    }

    const byId = new Map(levels.map((l) => [l.id, l]));
    const toSave = input.ids.map((id, index) => {
      const level = byId.get(id)!;
      level.sortOrder = index;
      if (reparent) {
        level.parentId = nextParent;
      }
      return level;
    });
    await this.gradeLevelRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }
}
