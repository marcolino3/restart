import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ProtocolStatus } from '../entities/protocol-status.enum';
import { ProtocolSectionsInput } from './protocol-sections.input';

@InputType()
export class CreateProtocolInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  // ISO date (YYYY-MM-DD).
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  meetingDate?: string | null;

  // Optional meeting window (HH:MM).
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime?: string | null;

  // Vorlage anwenden: kopiert Traktanden + Standard-Teilnehmende (nur beim
  // Erstellen; explizit mitgegebene sections/participants gewinnen).
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  templateId?: string | null;

  @Field(() => ProtocolStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProtocolStatus)
  status?: ProtocolStatus;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  participantMembershipIds?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  externalParticipants?: string[];

  @Field(() => ProtocolSectionsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProtocolSectionsInput)
  sections?: ProtocolSectionsInput;
}
