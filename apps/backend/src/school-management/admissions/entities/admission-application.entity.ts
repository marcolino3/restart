import { AbstractEntity } from '@/database/abstract.entity';
import { Gender } from '@/database/enums/gender.enum';
import { Organization } from '@/organizations/entities/organization.entity';
import { AdmissionRejectionReason } from '@/school-management/admission-rejection-reasons/entities/admission-rejection-reason.entity';
import { AdmissionSource } from '@/school-management/admission-sources/entities/admission-source.entity';
import { AdmissionStage } from '@/school-management/admission-stages/entities/admission-stage.entity';
import { Family } from '@/school-management/families/entities/family.entity';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { Field, HideField, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AdmissionApplicationSource } from '../enums/admission-application-source.enum';
import { AdmissionApplicationStatus } from '../enums/admission-application-status.enum';
import { AdmissionRejectedBy } from '../enums/admission-rejected-by.enum';
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

  /**
   * Grade level assigned by the school. May reference either a top-level Stufe
   * or a subgroup (Untergruppe); the Stufe is derived via `parent`. Set by the
   * school, not requested by the parents — hence "assigned", not "desired".
   */
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'assigned_grade_level_id', nullable: true })
  assignedGradeLevelId?: string | null;

  @Field(() => GradeLevel, { nullable: true })
  @ManyToOne(() => GradeLevel, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_grade_level_id' })
  assignedGradeLevel?: GradeLevel | null;

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

  /**
   * Legacy enum column, kept during the expand/contract migration so a rollback
   * of the app code is safe. No longer exposed to GraphQL nor written by new
   * code — the intake channel now lives in `admissionSource`. Dropped in a later
   * contract migration.
   */
  @HideField()
  @Column('enum', {
    enum: AdmissionApplicationSource,
    default: AdmissionApplicationSource.MANUAL,
  })
  source: AdmissionApplicationSource;

  /** Intake channel ("Eingangskanal") — org-configurable, replaces `source`. */
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'admission_source_id', nullable: true })
  admissionSourceId?: string | null;

  @Field(() => AdmissionSource, { nullable: true })
  @ManyToOne(() => AdmissionSource, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admission_source_id' })
  admissionSource?: AdmissionSource | null;

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

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'rejection_reason_id', nullable: true })
  rejectionReasonId?: string | null;

  @Field(() => AdmissionRejectionReason, { nullable: true })
  @ManyToOne(() => AdmissionRejectionReason, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rejection_reason_id' })
  rejectionReasonRef?: AdmissionRejectionReason | null;

  @Field(() => AdmissionRejectedBy, { nullable: true })
  @Column('text', { name: 'rejected_by', nullable: true })
  rejectedBy?: AdmissionRejectedBy | null;

  // Optional waitlist target ("Wiedervorlage"): a future school year the family
  // may be reconsidered for after a rejection. Free text (e.g. "2027/28"),
  // null when the rejection is final.
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'follow_up_year', nullable: true })
  followUpYear?: string | null;
}
