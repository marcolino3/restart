import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { IGradeLevel } from '../interfaces/grade-level.interface';

@ObjectType()
@Entity('grade_levels')
@Index('UQ_grade_level_org_name', ['organizationId', 'name'], { unique: true })
@Index('idx_grade_levels_org', ['organizationId'])
export class GradeLevel
  extends AbstractEntity<GradeLevel>
  implements IGradeLevel
{
  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  color?: string | null;

  @Field(() => Int)
  @Column('integer', { default: 0 })
  sortOrder: number;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
