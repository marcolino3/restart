import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateCompanyVacationInput } from './create-company-vacation.input';

@InputType()
export class UpdateCompanyVacationInput extends PartialType(
  CreateCompanyVacationInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
