import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateContractTemplateInput } from './create-contract-template.input';

@InputType()
export class UpdateContractTemplateInput extends PartialType(
  CreateContractTemplateInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
