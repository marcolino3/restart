import { CreateMembershipInput } from './create-membership.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateMembershipInput extends PartialType(CreateMembershipInput) {
  @Field(() => Int)
  id: number;
}
