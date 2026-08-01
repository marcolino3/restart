import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ISchoolClassEnrollment } from '../interfaces/school-class-enrollment.interface';

@ObjectType()
@Entity('school_class_enrollments')
@Index('idx_enrollment_org', ['organizationId'])
@Index('idx_enrollment_student', ['studentId'])
@Index('idx_enrollment_class', ['schoolClassId'])
@Index(
  'UQ_enrollment_student_class_date',
  ['studentId', 'schoolClassId', 'enrolledAt'],
  {
    unique: true,
  },
)
export class SchoolClassEnrollment
  extends AbstractEntity<SchoolClassEnrollment>
  implements ISchoolClassEnrollment
{
  @Field(() => String)
  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @Field(() => Student)
  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Field(() => String)
  @Column('uuid', { name: 'school_class_id' })
  schoolClassId: string;

  @Field(() => SchoolClass)
  @ManyToOne(() => SchoolClass)
  @JoinColumn({ name: 'school_class_id' })
  schoolClass: SchoolClass;

  /**
   * Subgroup within the class, e.g. US2 inside "Unterstufe".
   *
   * Null when the school does not split the class, or when nobody has
   * assigned this child yet. Sits here rather than on the student so it
   * follows the class assignment and leaves a history behind.
   */
  @Field(() => String, { nullable: true })
  @Column('uuid', { name: 'grade_level_id', nullable: true })
  gradeLevelId?: string | null;

  @Field(() => GradeLevel, { nullable: true })
  @ManyToOne(() => GradeLevel, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'grade_level_id' })
  gradeLevel?: GradeLevel | null;

  @Field(() => String)
  @Column('date', { name: 'enrolled_at' })
  enrolledAt: string;

  @Field(() => String, { nullable: true })
  @Column('date', { name: 'left_at', nullable: true })
  leftAt?: string | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
