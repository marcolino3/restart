import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { User } from '@/users/entities/user.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CurriculumNode } from '../../entities/curriculum-node.entity';
import { LessonRecordDifficulty } from '../../enums/lesson-record-difficulty.enum';
import { LessonRecordEngagement } from '../../enums/lesson-record-engagement.enum';
import { LessonRecordSelfAssessment } from '../../enums/lesson-record-self-assessment.enum';
import { LessonRecordSocialForm } from '../../enums/lesson-record-social-form.enum';
import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';
import { RoomMood } from '../../enums/room-mood.enum';
import { TeacherPreparation } from '../../enums/teacher-preparation.enum';
import { TeacherStressLevel } from '../../enums/teacher-stress-level.enum';
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

  @Field(() => LessonRecordEngagement, { nullable: true })
  @Column('enum', {
    enum: LessonRecordEngagement,
    enumName: 'lesson_records_engagement_enum',
    nullable: true,
  })
  engagement?: LessonRecordEngagement | null;

  @Field(() => LessonRecordDifficulty, { nullable: true })
  @Column('enum', {
    enum: LessonRecordDifficulty,
    enumName: 'lesson_records_difficulty_enum',
    nullable: true,
  })
  difficulty?: LessonRecordDifficulty | null;

  @Field(() => LessonRecordSocialForm, { nullable: true })
  @Column('enum', {
    enum: LessonRecordSocialForm,
    enumName: 'lesson_records_social_form_enum',
    name: 'social_form',
    nullable: true,
  })
  socialForm?: LessonRecordSocialForm | null;

  @Field(() => LessonRecordSelfAssessment, { nullable: true })
  @Column('enum', {
    enum: LessonRecordSelfAssessment,
    enumName: 'lesson_records_self_assessment_enum',
    name: 'self_assessment',
    nullable: true,
  })
  selfAssessment?: LessonRecordSelfAssessment | null;

  @Field(() => Boolean)
  @Column('boolean', {
    name: 'self_assessment_by_child',
    default: false,
  })
  selfAssessmentByChild: boolean;

  @Field(() => Boolean, { nullable: true })
  @Column('boolean', { name: 'lesson_clarity_confirmed', nullable: true })
  lessonClarityConfirmed?: boolean | null;

  // ─── LK-Selbstbeobachtung (per Lesson-Record, gemeinsam für alle Kinder)
  // Beim Bulk-Create wird der gleiche Wert für jedes Kind seeded;
  // per-child Override über Update-Mutation wie bei den anderen Achsen.

  @Field(() => TeacherPreparation, { nullable: true })
  @Column('enum', {
    enum: TeacherPreparation,
    enumName: 'lesson_records_teacher_preparation_enum',
    name: 'teacher_preparation',
    nullable: true,
  })
  teacherPreparation?: TeacherPreparation | null;

  @Field(() => RoomMood, { nullable: true })
  @Column('enum', {
    enum: RoomMood,
    enumName: 'lesson_records_room_mood_enum',
    name: 'room_mood',
    nullable: true,
  })
  roomMood?: RoomMood | null;

  @Field(() => TeacherStressLevel, { nullable: true })
  @Column('enum', {
    enum: TeacherStressLevel,
    enumName: 'lesson_records_teacher_stress_level_enum',
    name: 'teacher_stress_level',
    nullable: true,
  })
  teacherStressLevel?: TeacherStressLevel | null;
}
