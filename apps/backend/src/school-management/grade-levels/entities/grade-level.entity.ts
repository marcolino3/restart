import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { IGradeLevel } from '../interfaces/grade-level.interface';

@ObjectType()
@Entity('grade_levels')
@Index('UQ_grade_level_org_name', ['organizationId', 'name'], { unique: true })
@Index('idx_grade_levels_org', ['organizationId'])
@Index('idx_grade_levels_parent', ['parentId'])
export class GradeLevel
  extends AbstractEntity<GradeLevel>
  implements IGradeLevel
{
  @Field(() => String)
  @Column('text')
  name: string;

  /**
   * Optional parent grade level. `null` = top-level Stufe; set = subgroup
   * ("Untergruppe"). Nesting is limited to a single level (a subgroup cannot
   * itself have subgroups) — enforced in GradeLevelsService, not the schema.
   */
  @Field(() => String, { nullable: true })
  @Column('uuid', { name: 'parent_id', nullable: true })
  parentId?: string | null;

  @ManyToOne(() => GradeLevel, (level) => level.children, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: GradeLevel | null;

  @OneToMany(() => GradeLevel, (level) => level.parent)
  children?: GradeLevel[];

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  color?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  shortCode?: string | null;

  @Field(() => Int, { nullable: true })
  @Column('integer', { nullable: true })
  ageMin?: number | null;

  @Field(() => Int, { nullable: true })
  @Column('integer', { nullable: true })
  ageMax?: number | null;

  @Field(() => Int)
  @Column('integer', { default: 0 })
  sortOrder: number;

  /** Computed in findAllByOrgId — number of active classes assigned to this level. */
  @Field(() => Int, { nullable: true })
  classCount?: number;

  /** Computed in findAllByOrgId — students currently enrolled in those classes. */
  @Field(() => Int, { nullable: true })
  studentCount?: number;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
