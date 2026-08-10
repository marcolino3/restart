import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class DuplicateRoleInput {
  @Field(() => ID)
  @IsUUID('4')
  sourceRoleId!: string;

  @Field(() => String)
  @IsString()
  @MaxLength(100)
  name!: string;
}
