import { AbstractEntity } from '@/database/abstract.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CurriculumLocale } from '../enums/curriculum-locale.enum';
import { CurriculumNode } from './curriculum-node.entity';

@ObjectType()
@Entity('curriculum_node_translations')
@Index('UQ_curriculum_node_translation', ['curriculumNodeId', 'locale'], {
  unique: true,
})
export class CurriculumNodeTranslation extends AbstractEntity<CurriculumNodeTranslation> {
  @Field(() => String)
  @Column('uuid', { name: 'curriculum_node_id' })
  curriculumNodeId: string;

  @ManyToOne(() => CurriculumNode, (n) => n.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'curriculum_node_id' })
  curriculumNode?: CurriculumNode;

  @Field(() => CurriculumLocale)
  @Column('enum', { enum: CurriculumLocale })
  locale: CurriculumLocale;

  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  notes?: string | null;
}
