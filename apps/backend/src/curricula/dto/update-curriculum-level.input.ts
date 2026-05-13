import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateCurriculumLevelInput } from './create-curriculum-level.input';

@InputType()
export class UpdateCurriculumLevelInput extends PartialType(
  CreateCurriculumLevelInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
