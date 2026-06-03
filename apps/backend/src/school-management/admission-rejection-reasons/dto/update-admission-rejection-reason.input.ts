import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateAdmissionRejectionReasonInput } from './create-admission-rejection-reason.input';

@InputType()
export class UpdateAdmissionRejectionReasonInput extends PartialType(
  CreateAdmissionRejectionReasonInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
