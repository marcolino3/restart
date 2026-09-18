import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, ArrayUnique, IsUUID } from 'class-validator';

@InputType()
export class ReorderExpenseCategoriesInput {
  @Field(() => [ID])
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  ids: string[];
}
