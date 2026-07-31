import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ISchoolClass } from '../interfaces/school-class.interface';
import { SchoolClassTeacher } from './school-class-teacher.entity';

@ObjectType()
@Entity('school_classes')
@Index('UQ_school_class_org_name', ['organizationId', 'name'], { unique: true })
@Index('idx_school_classes_org', ['organizationId'])
export class SchoolClass
  extends AbstractEntity<SchoolClass>
  implements ISchoolClass
{
  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => [GradeLevel], { nullable: true })
  @ManyToMany(() => GradeLevel)
  @JoinTable({ name: 'school_class_grade_levels' })
  gradeLevels?: GradeLevel[];

  /**
   * Assignments with role, workload and validity — the owning relation for
   * `school_class_teachers`.
   */
  @Field(() => [SchoolClassTeacher], { nullable: true })
  @OneToMany(() => SchoolClassTeacher, (assignment) => assignment.schoolClass)
  teacherAssignments?: SchoolClassTeacher[];

  /**
   * Flat list of assigned teachers, for consumers that only need the people.
   *
   * Deliberately NOT a mapped relation. It used to be a @ManyToMany with a
   * @JoinTable on `school_class_teachers`, but that table now belongs to
   * {@link SchoolClassTeacher}. Two mappings over one table make TypeORM treat
   * it as a plain junction and schedule a DROP for every extra column — role,
   * workload and validity included. Verified against the schema builder, which
   * emitted exactly those DROPs while both mappings existed.
   *
   * The service populates it from `teacherAssignments`, so reads keep working
   * unchanged; writes go through the assignments.
   */
  @Field(() => [Employee], { nullable: true })
  teachers?: Employee[];

  /**
   * Short label for timetables and compact lists (e.g. "P1a"), where the full
   * class name does not fit.
   */
  @Field(() => String, { nullable: true })
  @Column('varchar', { name: 'short_code', length: 16, nullable: true })
  shortCode?: string | null;

  @Field(() => String, { nullable: true })
  @Column('varchar', { length: 7, nullable: true })
  color?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string | null;

  @Field(() => Int)
  @Column('integer', { default: 0 })
  sortOrder: number;

  @Field(() => Int, { nullable: true })
  @Column('integer', { nullable: true })
  maxCapacity?: number | null;

  @Field(() => String, { nullable: true })
  @Column('varchar', { length: 100, nullable: true })
  room?: string | null;

  /** Computed in findAllByOrgId — students currently enrolled (left_at IS NULL). */
  @Field(() => Int, { nullable: true })
  enrolledCount?: number;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
