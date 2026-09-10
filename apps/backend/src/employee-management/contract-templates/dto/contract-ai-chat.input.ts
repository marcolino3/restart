import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export const CONTRACT_AI_MAX_MESSAGES = 40;
export const CONTRACT_AI_MAX_CURRENT_HTML_CHARS = 40_000;

@InputType()
export class ContractAiChatMessageInput {
  @Field()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @Field()
  @IsString()
  @MaxLength(20000)
  content: string;
}

/**
 * Wrapped in a single input object so the global ValidationPipe validates the
 * nested messages — a bare top-level array argument is skipped by the pipe.
 */
@InputType()
export class ContractAiChatInput {
  @Field(() => [ContractAiChatMessageInput])
  @ValidateNested({ each: true })
  @Type(() => ContractAiChatMessageInput)
  @ArrayMinSize(1)
  @ArrayMaxSize(CONTRACT_AI_MAX_MESSAGES)
  messages: ContractAiChatMessageInput[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(CONTRACT_AI_MAX_CURRENT_HTML_CHARS)
  currentHtml?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  contractId?: string;
}
