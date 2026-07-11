import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { StudentRecordCategory } from './student-record-category.entity';

/**
 * A single support-record log entry for a student (Scope 2 — Förderprofil).
 * Modeled on admission-activity: org-scoped, author = Membership (SET NULL),
 * `occurredAt` for when it happened. School-internal, confidential by default.
 * No status field (kept minimal — add later if needed).
 */
@ObjectType()
@Entity('student_record_entries')
@Index('idx_student_record_entries_org', ['organizationId'])
@Index('idx_student_record_entries_student_occurred', [
  'studentId',
  'occurredAt',
])
export class StudentRecordEntry extends AbstractEntity<StudentRecordEntry> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @Field(() => Student, { nullable: true })
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student?: Student;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'category_id', nullable: true })
  categoryId?: string | null;

  @Field(() => StudentRecordCategory, { nullable: true })
  @ManyToOne(() => StudentRecordCategory, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category?: StudentRecordCategory | null;

  @Field(() => String, { nullable: true })
  @Column('varchar', { length: 200, nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  content?: string | null;

  @Field(() => Date)
  @Column('timestamptz', { name: 'occurred_at' })
  occurredAt: Date;

  @Field(() => Boolean)
  @Column('boolean', { name: 'is_confidential', default: true })
  isConfidential: boolean;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'author_membership_id', nullable: true })
  authorMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_membership_id' })
  authorMembership?: Membership | null;
}
