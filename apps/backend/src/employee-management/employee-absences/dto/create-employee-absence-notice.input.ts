import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

@InputType()
export class CreateEmployeeAbsenceNoticeInput {
  @Field(() => String)
  @IsDateString()
  startDate: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  endDate: string;

  @Field(() => ID)
  @IsUUID('4')
  absenceCategoryId: string;

  @Field(() => String)
  @IsString()
  note: string;

  @Field(() => Boolean)
  @IsBoolean()
  isTeamInformed: boolean;
}
