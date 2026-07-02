import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AgendaGoal } from '../entities/agenda-goal.enum';

@InputType()
export class AgendaItemInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  no?: number | null;

  @Field(() => String)
  @IsString()
  @MaxLength(500)
  topic: string;

  @Field(() => AgendaGoal, { nullable: true })
  @IsOptional()
  @IsEnum(AgendaGoal)
  goal?: AgendaGoal | null;
}

@InputType()
export class ProtocolDecisionInput {
  @Field(() => String)
  @IsString()
  @MaxLength(500)
  topic: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  decision?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  responsible?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dueDate?: string | null;
}

@InputType()
export class ProtocolCommunicationInput {
  @Field(() => String)
  @IsString()
  @MaxLength(500)
  topic: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  audience?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  responsible?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  channel?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dueDate?: string | null;
}

@InputType()
export class ProtocolChallengeInput {
  @Field(() => String)
  @IsString()
  @MaxLength(500)
  topic: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  challenge?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  supportNeeded?: string | null;
}

@InputType()
export class ProtocolOpenPointInput {
  @Field(() => String)
  @IsString()
  @MaxLength(500)
  topic: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  nextStep?: string | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  forNextMeeting?: boolean;
}

@InputType()
export class ProtocolSectionsInput {
  @Field(() => [AgendaItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgendaItemInput)
  agendaItems?: AgendaItemInput[];

  @Field(() => [ProtocolDecisionInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProtocolDecisionInput)
  decisions?: ProtocolDecisionInput[];

  @Field(() => [ProtocolCommunicationInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProtocolCommunicationInput)
  communications?: ProtocolCommunicationInput[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  infoPoints?: string[];

  @Field(() => [ProtocolChallengeInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProtocolChallengeInput)
  challenges?: ProtocolChallengeInput[];

  @Field(() => [ProtocolOpenPointInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProtocolOpenPointInput)
  openPoints?: ProtocolOpenPointInput[];
}
