import { Field, Float, ID, InputType } from '@nestjs/graphql';
import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_AMOUNT } from './upsert-class-budget.input';

@InputType()
export class CreateClassExpenseInput {
  @Field(() => ID)
  @IsUUID()
  schoolClassId: string;

  @Field(() => ID)
  @IsUUID()
  categoryId: string;

  /** ISO date (YYYY-MM-DD). */
  @Field(() => String)
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  expenseDate: string;

  @Field(() => Float)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0.01)
  @Max(MAX_AMOUNT)
  amount: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendor?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /** `<uuid>.<ext>` returned by the receipt upload endpoint. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/)
  receiptFileId?: string;
}
