import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

/**
 * What the AI read from a receipt. A suggestion only — nothing is saved; the
 * teacher reviews the prefilled form and saves it themselves.
 */
@ObjectType()
export class ExpenseReceiptSuggestion {
  @Field(() => String, { nullable: true })
  vendor: string | null;

  @Field(() => String, { nullable: true })
  invoiceNumber: string | null;

  /** YYYY-MM-DD */
  @Field(() => String, { nullable: true })
  expenseDate: string | null;

  @Field(() => Float, { nullable: true })
  amount: number | null;

  @Field(() => String, { nullable: true })
  currency: string | null;

  @Field(() => String, { nullable: true })
  description: string | null;

  /** Always a non-archived category of the caller's organization, or null. */
  @Field(() => ID, { nullable: true })
  suggestedCategoryId: string | null;

  @Field(() => Float, { nullable: true })
  confidence: number | null;
}
