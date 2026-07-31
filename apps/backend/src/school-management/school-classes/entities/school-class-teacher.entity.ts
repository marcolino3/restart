import { AbstractEntity } from '@/database/abstract.entity';
import { SchoolClassTeacherRole } from '@/database/enums/school-class-teacher-role.enum';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ISchoolClassTeacher } from '../interfaces/school-class-teacher.interface';

/**
 * A teacher's assignment to a class, with role, workload and validity.
 *
 * This used to be a plain @ManyToMany join table. It became an entity because
 * an assignment carries facts of its own: who leads the class, at what
 * workload, and for which period. The period is what lets a class list be
 * rebuilt for any past date without a SchoolYear entity.
 */
@ObjectType()
@Entity('school_class_teachers')
@Index('idx_school_class_teachers_org', ['organizationId'])
@Index('idx_school_class_teachers_validity', [
  'schoolClassId',
  'validFrom',
  'validTo',
])
export class SchoolClassTeacher
  extends AbstractEntity<SchoolClassTeacher>
  implements ISchoolClassTeacher
{
  @Field(() => String)
  @Column('uuid', { name: 'school_class_id' })
  schoolClassId: string;

  @Field(() => SchoolClass)
  @ManyToOne(
    () => SchoolClass,
    (schoolClass) => schoolClass.teacherAssignments,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'school_class_id' })
  schoolClass: SchoolClass;

  @Field(() => String)
  @Column('uuid', { name: 'employee_id' })
  employeeId: string;

  @Field(() => Employee)
  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Field(() => SchoolClassTeacherRole)
  @Column('enum', {
    enum: SchoolClassTeacherRole,
    enumName: 'school_class_teachers_role_enum',
    default: SchoolClassTeacherRole.LEAD,
  })
  role: SchoolClassTeacherRole;

  /** Share of a full teaching load, 0–100. Null when the school does not track it. */
  @Field(() => Int, { nullable: true })
  @Column('smallint', { name: 'workload_percent', nullable: true })
  workloadPercent?: number | null;

  @Field(() => String)
  @Column('date', { name: 'valid_from' })
  validFrom: string;

  /** Null means the assignment is still running. */
  @Field(() => String, { nullable: true })
  @Column('date', { name: 'valid_to', nullable: true })
  validTo?: string | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
