import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { IStudentRecordCategory } from '../interfaces/student-record-category.interface';

/**
 * Org-managed support-record category (e.g. Logopädie, IF, DaZ, Psychomotorik,
 * Schulpsychologie). Modeled on AdmissionSource — the school maintains its own
 * list. Soft-archive + reorderable via AbstractEntity's isArchived + position.
 */
@ObjectType()
@Entity('student_record_categories')
@Index('idx_student_record_categories_org', ['organizationId'])
@Index('UQ_student_record_category_org_name', ['organizationId', 'name'], {
  unique: true,
})
export class StudentRecordCategory
  extends AbstractEntity<StudentRecordCategory>
  implements IStudentRecordCategory
{
  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  color?: string | null;

  @Field(() => Int)
  @Column('int', { default: 0 })
  position: number;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
