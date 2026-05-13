import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ICurriculumLevel } from '../interfaces/curriculum-level.interface';
import { CurriculumLevelTranslation } from './curriculum-level-translation.entity';

@ObjectType()
@Entity('curriculum_levels')
@Index('idx_curriculum_levels_org', ['organizationId'])
@Index('UQ_curriculum_level_org_slug', ['organizationId', 'slug'], {
  unique: true,
})
export class CurriculumLevel
  extends AbstractEntity<CurriculumLevel>
  implements ICurriculumLevel
{
  @Field(() => String)
  @Column('text')
  slug: string;

  @Field(() => Int)
  @Column('int', { default: 0 })
  position: number;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Field(() => [CurriculumLevelTranslation], { nullable: true })
  @OneToMany(() => CurriculumLevelTranslation, (t) => t.curriculumLevel, {
    cascade: false,
  })
  translations?: CurriculumLevelTranslation[];
}
