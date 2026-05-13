import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateGradeLevelInput } from './create-grade-level.input';

@InputType()
export class UpdateGradeLevelInput extends PartialType(CreateGradeLevelInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
