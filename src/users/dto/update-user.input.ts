import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateUserInput } from './create-user.input';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => ID)
  @IsUUID('4')
  id: string;

  @Field(() => String)
  @IsOptional()
  @IsString()
  refreshToken: string;
}
