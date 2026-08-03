import { AbstractEntity } from '@/database/abstract.entity';
import { Locale } from '@/database/enums/locale.enum';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EmployeeFunction } from './employee-function.entity';

@ObjectType()
@Entity('employee_function_translations')
@Index('UQ_employee_function_translation', ['functionId', 'locale'], {
  unique: true,
})
export class EmployeeFunctionTranslation extends AbstractEntity<EmployeeFunctionTranslation> {
  @Field(() => ID)
  @Column('uuid', { name: 'function_id' })
  functionId!: string;

  @ManyToOne(() => EmployeeFunction, (f) => f.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'function_id' })
  function?: EmployeeFunction;

  @Field(() => Locale)
  @Column('enum', { enum: Locale })
  locale!: Locale;

  @Field(() => String)
  @Column('varchar', { length: 200 })
  name!: string;
}
