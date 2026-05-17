import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { User } from '@/users/entities/user.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CurriculumNode } from '../../entities/curriculum-node.entity';
import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';
import { ILessonRecord } from '../interfaces/lesson-record.interface';

@ObjectType()
@Entity('lesson_records')
@Index('idx_lesson_records_org', ['organizationId'])
@Index('idx_lesson_records_student', ['studentId'])
@Index('idx_lesson_records_lesson', ['lessonId'])
@Index('idx_lesson_records_student_lesson_date', [
  'organizationId',
  'studentId',
  'lessonId',
  'recordedAt',
])
@Index('idx_lesson_records_lesson_date', [
  'organizationId',
  'lessonId',
  'recordedAt',
])
export class LessonRecord
  extends AbstractEntity<LessonRecord>
  implements ILessonRecord
{
  @Field(() => ID)
  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @Field(() => Student, { nullable: true })
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student?: Student;

  @Field(() => ID)
  @Column('uuid', { name: 'lesson_id' })
  lessonId: string;

  @Field(() => CurriculumNode, { nullable: true })
  @ManyToOne(() => CurriculumNode, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: CurriculumNode;

  @Field(() => String)
  @Column('date', { name: 'recorded_at' })
  recordedAt: string;

  @Field(() => LessonRecordStatus)
  @Column('enum', { enum: LessonRecordStatus })
  status: LessonRecordStatus;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  note?: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'recorded_by_id', nullable: true })
  recordedById?: string | null;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recorded_by_id' })
  recordedBy?: User | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'school_class_enrollment_id', nullable: true })
  schoolClassEnrollmentId?: string | null;

  @Field(() => SchoolClassEnrollment, { nullable: true })
  @ManyToOne(() => SchoolClassEnrollment, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'school_class_enrollment_id' })
  schoolClassEnrollment?: SchoolClassEnrollment | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
