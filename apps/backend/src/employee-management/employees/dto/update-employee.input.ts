import { IsUUID, IsInt, Min } from 'class-validator';
import { CreateEmployeeInput } from './create-employee.input';
import { InputType, Field, PartialType, ID, Int } from '@nestjs/graphql';

@InputType()
export class UpdateEmployeeInput extends PartialType(CreateEmployeeInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
