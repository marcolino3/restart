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
