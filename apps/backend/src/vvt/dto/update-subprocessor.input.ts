import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateSubprocessorInput } from './create-subprocessor.input';

@InputType()
export class UpdateSubprocessorInput extends PartialType(
  CreateSubprocessorInput,
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
