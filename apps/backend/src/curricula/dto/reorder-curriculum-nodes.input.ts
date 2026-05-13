import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class ReorderCurriculumNodesInput {
  @Field(() => ID)
  @IsUUID()
  curriculumId: string;

  @Field(() => ID)
  @IsUUID()
  levelId: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @Field(() => [ID])
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];
}
