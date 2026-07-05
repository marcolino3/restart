import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AgendaItemInput } from './protocol-sections.input';

@InputType()
export class CreateProtocolTemplateInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @Field(() => [AgendaItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgendaItemInput)
  agendaItems?: AgendaItemInput[];

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  defaultParticipantMembershipIds?: string[];
}
