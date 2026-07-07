import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateAdmissionSourceInput } from './create-admission-source.input';

@InputType()
export class UpdateAdmissionSourceInput extends PartialType(
  CreateAdmissionSourceInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
