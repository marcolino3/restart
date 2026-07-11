import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ConversationType } from '../entities/conversation-type.enum';

@InputType()
export class CreateConversationInput {
  @Field(() => ConversationType)
  @IsEnum(ConversationType)
  type: ConversationType;

  // Required for GROUP; ignored for DIRECT/TEAM (title is derived).
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string | null;

  // Membership ids of the other participants. For DIRECT exactly one; for
  // GROUP one or more. The caller is always added implicitly.
  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  participantMembershipIds?: string[];

  // Required for TEAM: the team this conversation is bound to. Participants are
  // resolved from the team's effective members.
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  teamId?: string | null;
}
