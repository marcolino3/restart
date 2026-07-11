import { Country } from '@/countries/entities/country.entity';
import { AbstractEntity } from '@/database/abstract.entity';
import { Gender } from '@/database/enums/gender.enum';
import { Organization } from '@/organizations/entities/organization.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { AdmissionStage } from '../../admission-stages/entities/admission-stage.entity';
import { IStudent } from '../interfaces/student.interface';

@ObjectType()
@Entity('students')
@Index('idx_students_org', ['organizationId'])
@Index(
  'UQ_student_org_name_dob',
  ['organizationId', 'firstName', 'lastName', 'dateOfBirth'],
  {
    unique: true,
  },
)
export class Student extends AbstractEntity<Student> implements IStudent {
  @Field(() => String)
  @Column('text')
  firstName: string;

  @Field(() => String)
  @Column('text')
  lastName: string;

  @Field(() => String, { nullable: true })
  @Column('date', { nullable: true })
  dateOfBirth?: string | null;

  @Field(() => Gender, { nullable: true })
  @Column('enum', { enum: Gender, nullable: true })
  gender?: Gender | null;

  @Field(() => String, { nullable: true })
  @Column('date', { name: 'enrollment_date', nullable: true })
  enrollmentDate?: string | null;

  @Field(() => String, { nullable: true })
  @Column('date', { name: 'exit_date', nullable: true })
  exitDate?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  notes?: string | null;

  // --- Master data extension (Scope 1) ---

  /** Preferred name used in day-to-day life (e.g. "Sasha" for "Alexander"). */
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'preferred_name', nullable: true })
  preferredName?: string | null;

  /** Place of birth (register/report use). */
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'place_of_birth', nullable: true })
  placeOfBirth?: string | null;

  /**
   * The child's first language(s). Kept on the student (not just contacts) for
   * DaZ / language-background analysis.
   */
  @Field(() => [String], { nullable: true })
  @Column('text', { name: 'first_languages', array: true, nullable: true })
  firstLanguages?: string[] | null;

  /** Language(s) spoken at home. */
  @Field(() => [String], { nullable: true })
  @Column('text', { name: 'family_languages', array: true, nullable: true })
  familyLanguages?: string[] | null;

  /**
   * Religion / confession. Sensitive (GDPR Art. 9) — never expose to a parent
   * scope; see docs/student-master-data-architecture.md (SCHOOL_ONLY).
   */
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  religion?: string | null;

  /**
   * Swiss social-security (AHV) number. Highly sensitive — treated like
   * ContactPerson.socialSecurityNumber, gated by STUDENT_READ, never in a
   * parent scope.
   */
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'social_security_number', nullable: true })
  socialSecurityNumber?: string | null;

  /** External / cantonal student id (Matrikelnummer). */
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'external_student_id', nullable: true })
  externalStudentId?: string | null;

  /** Nationalities — M:N to the global Country entity. */
  @Field(() => [Country], { nullable: true })
  @ManyToMany(() => Country)
  @JoinTable({
    name: 'student_nationalities',
    joinColumn: { name: 'student_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'country_id', referencedColumnName: 'id' },
  })
  nationalities?: Country[];

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'admission_stage_id', nullable: true })
  admissionStageId?: string | null;

  @Field(() => AdmissionStage, { nullable: true })
  @ManyToOne(() => AdmissionStage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admission_stage_id' })
  admissionStage?: AdmissionStage | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'admission_application_id', nullable: true })
  admissionApplicationId?: string | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
