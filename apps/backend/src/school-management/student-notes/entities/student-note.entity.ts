import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { StudentNoteCategory } from '../interfaces/student-note-category.enum';

@ObjectType()
@Entity('student_notes')
export class StudentNote extends AbstractEntity<StudentNote> {
  @Field(() => ID)
  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @Field(() => Student)
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'author_membership_id', nullable: true })
  authorMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_membership_id' })
  authorMembership?: Membership | null;

  @Field(() => StudentNoteCategory)
  @Column({
    name: 'category',
    type: 'enum',
    enum: StudentNoteCategory,
    default: StudentNoteCategory.GENERAL,
  })
  category: StudentNoteCategory;

  @Field(() => String)
  @Column({ name: 'title', type: 'varchar', length: 200 })
  title: string;

  @Field(() => String)
  @Column({ name: 'content', type: 'text' })
  content: string;

  @Field(() => Boolean)
  @Column({ name: 'is_confidential', type: 'boolean', default: false })
  isConfidential: boolean;

  @Field(() => String)
  @Column({ name: 'date', type: 'date' })
  date: string;
}
