import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ExpenseAiModel {
  @Field()
  id: string;

  @Field(() => String, { nullable: true })
  displayName: string | null;
}

/**
 * Models the stored key can use. A failed lookup is not an exception: the
 * settings form falls back to a free-text model id and shows `errorCode`.
 */
@ObjectType()
export class ExpenseAiModelList {
  @Field(() => [ExpenseAiModel])
  models: ExpenseAiModel[];

  /** One of the stable `EXPENSE_AI_*` codes, translated by the web app. */
  @Field(() => String, { nullable: true })
  errorCode: string | null;
}
