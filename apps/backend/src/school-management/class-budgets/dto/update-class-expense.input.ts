import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateClassExpenseInput } from './create-class-expense.input';

@InputType()
export class UpdateClassExpenseInput extends PartialType(
  CreateClassExpenseInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
