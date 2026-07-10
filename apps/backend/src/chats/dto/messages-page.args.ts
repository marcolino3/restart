import { ArgsType, Field, ID, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

@ArgsType()
export class MessagesPageArgs {
  @Field(() => ID)
  @IsUUID()
  conversationId: string;

  // Cursor: load messages created strictly before this message id (older page).
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  before?: string | null;

  @Field(() => Int, { defaultValue: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;
}
