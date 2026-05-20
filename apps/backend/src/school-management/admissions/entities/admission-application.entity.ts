import { AbstractEntity } from '@/database/abstract.entity';
import { Gender } from '@/database/enums/gender.enum';
import { Organization } from '@/organizations/entities/organization.entity';
import { AdmissionStage } from '@/school-management/admission-stages/entities/admission-stage.entity';
import { Family } from '@/school-management/families/entities/family.entity';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AdmissionApplicationSource } from '../enums/admission-application-source.enum';
import { AdmissionApplicationStatus } from '../enums/admission-application-status.enum';
import { IAdmissionApplication } from '../interfaces/admission-application.interface';

@ObjectType()
@Entity('admission_applications')
@Index('idx_admission_apps_org', ['organizationId'])
@Index('idx_admission_apps_family', ['familyId'])
@Index('idx_admission_apps_stage', ['admissionStageId'])
@Index('idx_admission_apps_org_stage_position', [
  'organizationId',
  'admissionStageId',
  'position',
])
export class AdmissionApplication
  extends AbstractEntity<AdmissionApplication>
  implements IAdmissionApplication
{
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'family_id' })
  familyId: string;

  @Field(() => Family, { nullable: true })
  @ManyToOne(() => Family, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'family_id' })
  family?: Family;

  @Field(() => ID)
  @Column('uuid', { name: 'admission_stage_id' })
  admissionStageId: string;

  @Field(() => AdmissionStage, { nullable: true })
  @ManyToOne(() => AdmissionStage, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'admission_stage_id' })
  admissionStage?: AdmissionStage;

  @Field(() => String)
  @Column('text', { name: 'child_first_name' })
  childFirstName: string;

  @Field(() => String)
  @Column('text', { name: 'child_last_name' })
  childLastName: string;

  @Field(() => String, { nullable: true })
  @Column('date', { name: 'child_date_of_birth', nullable: true })
  childDateOfBirth?: string | null;

  @Field(() => Gender, { nullable: true })
  @Column('enum', {
    enum: Gender,
    enumName: 'admission_applications_child_gender_enum',
    name: 'child_gender',
    nullable: true,
  })
  childGender?: Gender | null;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'child_notes', nullable: true })
  childNotes?: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'desired_grade_level_id', nullable: true })
  desiredGradeLevelId?: string | null;

  @Field(() => GradeLevel, { nullable: true })
  @ManyToOne(() => GradeLevel, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'desired_grade_level_id' })
  desiredGradeLevel?: GradeLevel | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'desired_school_class_id', nullable: true })
  desiredSchoolClassId?: string | null;

  @Field(() => SchoolClass, { nullable: true })
  @ManyToOne(() => SchoolClass, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'desired_school_class_id' })
  desiredSchoolClass?: SchoolClass | null;

  @Field(() => String, { nullable: true })
  @Column('date', { name: 'desired_enrollment_date', nullable: true })
  desiredEnrollmentDate?: string | null;

  @Field(() => AdmissionApplicationStatus)
  @Column('enum', {
    enum: AdmissionApplicationStatus,
    default: AdmissionApplicationStatus.ACTIVE,
  })
  status: AdmissionApplicationStatus;

  @Field(() => AdmissionApplicationSource)
  @Column('enum', {
    enum: AdmissionApplicationSource,
    default: AdmissionApplicationSource.MANUAL,
  })
  source: AdmissionApplicationSource;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'enrolled_student_id', nullable: true })
  enrolledStudentId?: string | null;

  @Field(() => Student, { nullable: true })
  @ManyToOne(() => Student, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'enrolled_student_id' })
  enrolledStudent?: Student | null;

  @Field(() => Date)
  @Column('timestamptz', {
    name: 'stage_entered_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  stageEnteredAt: Date;

  @Field(() => Int)
  @Column('int', { default: 0 })
  position: number;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'rejection_reason', nullable: true })
  rejectionReason?: string | null;
}
