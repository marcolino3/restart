import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateMembershipInput } from './create-membership.input';

@InputType()
export class UpdateMembershipInput extends PartialType(CreateMembershipInput) {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
