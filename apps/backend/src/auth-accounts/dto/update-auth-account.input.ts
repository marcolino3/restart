import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateAuthAccountInput } from './create-auth-account.input';

@InputType()
export class UpdateAuthAccountInput extends PartialType(
  CreateAuthAccountInput,
) {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
