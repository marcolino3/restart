import { InputType, Field, ID } from '@nestjs/graphql';
import { ArrayMaxSize, IsUUID } from 'class-validator';

@InputType()
export class UpdateRoleMembersInput {
  @Field(() => ID)
  @IsUUID('4')
  roleId: string;

  @Field(() => [ID])
  @ArrayMaxSize(1000)
  @IsUUID('4', { each: true })
  membershipIds: string[];
}
