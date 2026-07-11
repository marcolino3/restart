import { Field, ID, ObjectType } from '@nestjs/graphql';

/** Payload of the messageDeleted subscription: which message, which chat. */
@ObjectType()
export class MessageDeleted {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  conversationId: string;
}
