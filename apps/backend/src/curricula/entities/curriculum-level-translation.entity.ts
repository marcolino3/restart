import { AbstractEntity } from '@/database/abstract.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CurriculumLocale } from '../enums/curriculum-locale.enum';
import { CurriculumLevel } from './curriculum-level.entity';

@ObjectType()
@Entity('curriculum_level_translations')
@Index('UQ_curriculum_level_translation', ['curriculumLevelId', 'locale'], {
  unique: true,
})
export class CurriculumLevelTranslation extends AbstractEntity<CurriculumLevelTranslation> {
  @Field(() => String)
  @Column('uuid', { name: 'curriculum_level_id' })
  curriculumLevelId: string;

  @ManyToOne(() => CurriculumLevel, (l) => l.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'curriculum_level_id' })
  curriculumLevel?: CurriculumLevel;

  @Field(() => CurriculumLocale)
  @Column('enum', { enum: CurriculumLocale })
  locale: CurriculumLocale;

  @Field(() => String)
  @Column('text')
  name: string;
}
