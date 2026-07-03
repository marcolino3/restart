import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateConsentPurposeInput } from './create-consent-purpose.input';

@InputType()
export class UpdateConsentPurposeInput extends PartialType(
  CreateConsentPurposeInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
