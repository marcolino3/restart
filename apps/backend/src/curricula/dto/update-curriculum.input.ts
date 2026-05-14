import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateCurriculumInput } from './create-curriculum.input';

@InputType()
export class UpdateCurriculumInput extends PartialType(CreateCurriculumInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
