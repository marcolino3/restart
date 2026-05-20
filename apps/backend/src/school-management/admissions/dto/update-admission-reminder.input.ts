import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType()
export class UpdateAdmissionReminderInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  note?: string | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assignedToMembershipId?: string | null;
}
