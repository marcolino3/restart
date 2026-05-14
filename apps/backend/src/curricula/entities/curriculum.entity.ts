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
import { ICurriculum } from '../interfaces/curriculum.interface';
import { CurriculumTranslation } from './curriculum-translation.entity';

@ObjectType()
@Entity('curricula')
@Index('idx_curricula_org', ['organizationId'])
@Index('UQ_curriculum_org_slug', ['organizationId', 'slug'], { unique: true })
export class Curriculum
  extends AbstractEntity<Curriculum>
  implements ICurriculum
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

  @Field(() => [CurriculumTranslation], { nullable: true })
  @OneToMany(() => CurriculumTranslation, (t) => t.curriculum, {
    cascade: false,
  })
  translations?: CurriculumTranslation[];
}
