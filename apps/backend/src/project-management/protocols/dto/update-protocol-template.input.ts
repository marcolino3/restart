import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateProtocolTemplateInput } from './create-protocol-template.input';

@InputType()
export class UpdateProtocolTemplateInput extends PartialType(
  CreateProtocolTemplateInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
