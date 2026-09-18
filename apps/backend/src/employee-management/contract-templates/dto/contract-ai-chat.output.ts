import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ContractAiChatResult {
  /** Conversational answer (questions, explanations) — may be empty when only a draft was returned. */
  @Field()
  reply: string;

  /** Sanitized contract HTML when the assistant produced or revised a draft. */
  @Field(() => String, { nullable: true })
  html: string | null;
}
