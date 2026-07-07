import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateAdmissionAppointmentTypeInput } from './create-admission-appointment-type.input';

@InputType()
export class UpdateAdmissionAppointmentTypeInput extends PartialType(
  CreateAdmissionAppointmentTypeInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
