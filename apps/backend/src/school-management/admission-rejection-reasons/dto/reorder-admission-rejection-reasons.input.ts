import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

@InputType()
export class ReorderAdmissionRejectionReasonsInput {
  @Field(() => [ID])
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];
}
