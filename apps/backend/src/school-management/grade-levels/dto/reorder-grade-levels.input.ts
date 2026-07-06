import { Field, ID, InputType } from '@nestjs/graphql';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

@InputType()
export class ReorderGradeLevelsInput {
  @Field(() => [ID])
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];

  /**
   * When present, the reordered levels are (re)assigned to this parent as a
   * batch — `null` moves them to top level, a UUID nests them as subgroups.
   * Omit to reorder within the current sibling group without re-parenting.
   */
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  parentId?: string | null;
}
