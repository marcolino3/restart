import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateProjectFromTemplateInput {
  @Field(() => ID)
  @IsUUID()
  templateId: string;

  // Title for the new project; defaults to the template title when omitted.
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  // Description for the new project; defaults to the template's description.
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  // ISO date (YYYY-MM-DD) — optional target date of the new project ("Fällig").
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  // ISO date (YYYY-MM-DD). Task due dates = startDate + dueOffsetDays.
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  memberMembershipIds?: string[];
}
