import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AdmissionAppointmentStatus } from '../enums/admission-appointment-status.enum';
import { CreateAdmissionAppointmentInput } from './create-admission-appointment.input';

@InputType()
export class UpdateAdmissionAppointmentInput extends PartialType(
  CreateAdmissionAppointmentInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => AdmissionAppointmentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(AdmissionAppointmentStatus)
  status?: AdmissionAppointmentStatus;
}
