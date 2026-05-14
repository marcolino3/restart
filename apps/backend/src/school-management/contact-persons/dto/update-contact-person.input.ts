import { Field, ID, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateContactPersonInput } from './create-contact-person.input';

@InputType()
export class UpdateContactPersonInput extends PartialType(
  OmitType(CreateContactPersonInput, ['links'] as const),
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
