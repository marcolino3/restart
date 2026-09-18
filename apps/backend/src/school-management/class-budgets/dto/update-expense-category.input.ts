import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { CreateExpenseCategoryInput } from './create-expense-category.input';

@InputType()
export class UpdateExpenseCategoryInput extends PartialType(
  CreateExpenseCategoryInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;

  /** Set to false to restore an archived category. */
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
