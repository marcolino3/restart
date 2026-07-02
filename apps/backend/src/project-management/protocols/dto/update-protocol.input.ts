import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateProtocolInput } from './create-protocol.input';

@InputType()
export class UpdateProtocolInput extends PartialType(CreateProtocolInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
