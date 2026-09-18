import { SchoolYear } from '@/school-management/school-classes/dto/school-year.object';
import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { ExpenseCategory } from '../entities/expense-category.entity';

@ObjectType()
export class ClassBudgetCategoryTotal {
  @Field(() => ExpenseCategory)
  category: ExpenseCategory;

  @Field(() => Float)
  total: number;
}

/**
 * Budget standing of one class in one school year. `budget` is null when no
 * budget was set; `remaining` then equals `-spent` and `isOverBudget` stays
 * false — there is nothing to overrun yet.
 */
@ObjectType()
export class ClassBudgetSummary {
  @Field(() => ID)
  schoolClassId: string;

  @Field(() => SchoolYear)
  schoolYear: SchoolYear;

  @Field(() => Float, { nullable: true })
  budget: number | null;

  @Field(() => Float)
  spent: number;

  @Field(() => Float)
  remaining: number;

  @Field(() => Boolean)
  isOverBudget: boolean;

  @Field(() => String)
  currency: string;

  @Field(() => [ClassBudgetCategoryTotal])
  byCategory: ClassBudgetCategoryTotal[];
}
