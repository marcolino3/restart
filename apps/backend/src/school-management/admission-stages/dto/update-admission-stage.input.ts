import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateAdmissionStageInput } from './create-admission-stage.input';

@InputType()
export class UpdateAdmissionStageInput extends PartialType(
  CreateAdmissionStageInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
