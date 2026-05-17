import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { ISchoolClass } from '../interfaces/school-class.interface';

@ObjectType()
@Entity('school_classes')
@Index('UQ_school_class_org_name', ['organizationId', 'name'], { unique: true })
@Index('idx_school_classes_org', ['organizationId'])
export class SchoolClass
  extends AbstractEntity<SchoolClass>
  implements ISchoolClass
{
  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => [GradeLevel], { nullable: true })
  @ManyToMany(() => GradeLevel)
  @JoinTable({ name: 'school_class_grade_levels' })
  gradeLevels?: GradeLevel[];

  @Field(() => [Employee], { nullable: true })
  @ManyToMany(() => Employee)
  @JoinTable({
    name: 'school_class_teachers',
    joinColumn: { name: 'school_class_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'employee_id', referencedColumnName: 'id' },
  })
  teachers?: Employee[];

  @Field(() => String, { nullable: true })
  @Column('varchar', { length: 7, nullable: true })
  color?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string | null;

  @Field(() => Int)
  @Column('integer', { default: 0 })
  sortOrder: number;

  @Field(() => Int, { nullable: true })
  @Column('integer', { nullable: true })
  maxCapacity?: number | null;

  @Field(() => String, { nullable: true })
  @Column('varchar', { length: 100, nullable: true })
  room?: string | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
