import { AbstractEntity } from '@/database/abstract.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CurriculumLocale } from '../enums/curriculum-locale.enum';
import { Curriculum } from './curriculum.entity';

@ObjectType()
@Entity('curriculum_translations')
@Index('UQ_curriculum_translation', ['curriculumId', 'locale'], {
  unique: true,
})
export class CurriculumTranslation extends AbstractEntity<CurriculumTranslation> {
  @Field(() => String)
  @Column('uuid', { name: 'curriculum_id' })
  curriculumId: string;

  @ManyToOne(() => Curriculum, (c) => c.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'curriculum_id' })
  curriculum?: Curriculum;

  @Field(() => CurriculumLocale)
  @Column('enum', { enum: CurriculumLocale })
  locale: CurriculumLocale;

  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string | null;
}
