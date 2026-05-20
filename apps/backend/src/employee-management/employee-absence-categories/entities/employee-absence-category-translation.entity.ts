import { AbstractEntity } from '@/database/abstract.entity';
import { Locale } from '@/database/enums/locale.enum';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EmployeeAbsenceCategory } from './employee-absence-category.entity';

@ObjectType()
@Entity('employee_absence_category_translations')
@Index('UQ_employee_absence_category_translation', ['categoryId', 'locale'], {
  unique: true,
})
export class EmployeeAbsenceCategoryTranslation extends AbstractEntity<EmployeeAbsenceCategoryTranslation> {
  @Field(() => ID)
  @Column('uuid', { name: 'category_id' })
  categoryId!: string;

  @ManyToOne(() => EmployeeAbsenceCategory, (c) => c.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category?: EmployeeAbsenceCategory;

  @Field(() => Locale)
  @Column('enum', { enum: Locale })
  locale!: Locale;

  @Field(() => String)
  @Column('text')
  name!: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description!: string | null;
}
