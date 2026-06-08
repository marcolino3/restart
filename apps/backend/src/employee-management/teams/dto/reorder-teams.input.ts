import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class ReorderTeamsInput {
  // The ordered ids of one sibling group. Their sortOrder is set to the array
  // index, so the group ends up in exactly this order.
  @Field(() => [ID])
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];

  // Optional re-parenting of the whole ordered group (drag-to-nest):
  //   - omitted (undefined) → leave parents unchanged (pure sibling reorder)
  //   - null                → move the group to the root level
  //   - a team id           → make the group children of that team
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
