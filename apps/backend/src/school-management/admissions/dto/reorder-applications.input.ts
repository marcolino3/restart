import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

@InputType()
export class ReorderAdmissionApplicationsInput {
  @Field(() => ID)
  @IsUUID()
  stageId: string;

  @Field(() => [ID])
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  applicationIds: string[];
}
