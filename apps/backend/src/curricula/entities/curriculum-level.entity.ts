import { AbstractEntity } from '@/database/abstract.entity';
import { Curriculum } from './curriculum.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
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
@Index('idx_curriculum_levels_curriculum', ['curriculumId'])
@Index('UQ_curriculum_level_curriculum_slug', ['curriculumId', 'slug'], {
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

  @Field(() => ID)
  @Column('uuid', { name: 'curriculum_id' })
  curriculumId: string;

  @Field(() => Curriculum, { nullable: true })
  @ManyToOne(() => Curriculum, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'curriculum_id' })
  curriculum?: Curriculum;

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
