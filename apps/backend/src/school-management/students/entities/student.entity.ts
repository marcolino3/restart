import { AbstractEntity } from '@/database/abstract.entity';
import { Gender } from '@/database/enums/gender.enum';
import { Organization } from '@/organizations/entities/organization.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AdmissionStage } from '../../admission-stages/entities/admission-stage.entity';
import { IStudent } from '../interfaces/student.interface';

@ObjectType()
@Entity('students')
@Index('idx_students_org', ['organizationId'])
@Index('UQ_student_org_name_dob', ['organizationId', 'firstName', 'lastName', 'dateOfBirth'], {
  unique: true,
})
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

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'admission_stage_id', nullable: true })
  admissionStageId?: string | null;

  @Field(() => AdmissionStage, { nullable: true })
  @ManyToOne(() => AdmissionStage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admission_stage_id' })
  admissionStage?: AdmissionStage | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
