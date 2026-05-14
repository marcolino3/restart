import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateSchoolClassInput } from './create-school-class.input';

@InputType()
export class UpdateSchoolClassInput extends PartialType(
  CreateSchoolClassInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
