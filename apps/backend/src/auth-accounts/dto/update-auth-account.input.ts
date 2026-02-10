import { CreateAuthAccountInput } from './create-auth-account.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateAuthAccountInput extends PartialType(
  CreateAuthAccountInput,
) {
  @Field(() => Int)
  id: number;
}
