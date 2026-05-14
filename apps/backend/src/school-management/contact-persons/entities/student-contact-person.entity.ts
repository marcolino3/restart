import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { RelationshipType } from '../enums/relationship-type.enum';
import { IStudentContactPerson } from '../interfaces/student-contact-person.interface';
import { ContactPerson } from './contact-person.entity';

@ObjectType()
@Entity('student_contact_persons')
@Index('idx_scp_org', ['organizationId'])
@Index('idx_scp_student', ['studentId'])
@Index('idx_scp_contact_person', ['contactPersonId'])
@Index(
  'UQ_scp_student_contact_relationship',
  ['studentId', 'contactPersonId', 'relationshipType'],
  { unique: true },
)
export class StudentContactPerson
  extends AbstractEntity<StudentContactPerson>
  implements IStudentContactPerson
{
  @Field(() => ID)
  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @Field(() => Student)
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Field(() => ID)
  @Column('uuid', { name: 'contact_person_id' })
  contactPersonId: string;

  @Field(() => ContactPerson)
  @ManyToOne(() => ContactPerson, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contact_person_id' })
  contactPerson: ContactPerson;

  @Field(() => RelationshipType)
  @Column('enum', { enum: RelationshipType, name: 'relationship_type' })
  relationshipType: RelationshipType;

  @Field(() => Boolean)
  @Column('boolean', { name: 'is_primary_contact', default: false })
  isPrimaryContact: boolean;

  @Field(() => Boolean)
  @Column('boolean', { name: 'has_custody', default: false })
  hasCustody: boolean;

  @Field(() => Boolean)
  @Column('boolean', { name: 'is_pickup_authorized', default: true })
  isPickupAuthorized: boolean;

  @Field(() => Int, { nullable: true })
  @Column('int', { name: 'emergency_priority', nullable: true })
  emergencyPriority?: number | null;

  @Field(() => Boolean)
  @Column('boolean', { name: 'lives_with_student', default: false })
  livesWithStudent: boolean;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  notes?: string | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
