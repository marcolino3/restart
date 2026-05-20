import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateAdmissionReminderInput {
  @Field(() => ID)
  @IsUUID()
  applicationId: string;

  @Field(() => String)
  @IsISO8601()
  dueAt: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  note?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assignedToMembershipId?: string;
}
