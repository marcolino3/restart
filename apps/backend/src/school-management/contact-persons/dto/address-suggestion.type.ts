import { Address } from '@/addresses/entities/address.entity';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AddressSuggestion {
  @Field(() => Address)
  address: Address;

  @Field(() => String)
  contactPersonName: string;

  @Field(() => String)
  relationshipType: string;

  @Field(() => String)
  studentName: string;
}
