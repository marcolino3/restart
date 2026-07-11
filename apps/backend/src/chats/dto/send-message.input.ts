import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class SendMessageInput {
  @Field(() => ID)
  @IsUUID()
  conversationId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  body: string;
}
