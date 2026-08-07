import { Field, InputType } from '@nestjs/graphql';
import { IsDateString, IsString } from 'class-validator';

@InputType()
export class CreateCompanyVacationInput {
  @Field(() => String)
  @IsString()
  name: string;

  @Field(() => String)
  @IsDateString()
  startDate: string;

  @Field(() => String)
  @IsDateString()
  endDate: string;
}
