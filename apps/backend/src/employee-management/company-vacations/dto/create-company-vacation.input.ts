import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

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

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  appliesToAll?: boolean;
}
