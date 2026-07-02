import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateEmployeePaidOvertimeInput } from './create-employee-paid-overtime.input';

@InputType()
export class UpdateEmployeePaidOvertimeInput extends PartialType(
  CreateEmployeePaidOvertimeInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
