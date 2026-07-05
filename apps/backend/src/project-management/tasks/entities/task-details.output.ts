import { Field, ObjectType } from '@nestjs/graphql';

/**
 * Checklist entry on a task ("Checkliste" in the task dialog). Stored inside
 * the task's `checklist` JSONB column — subordinate data with no identity
 * outside its task, so no own table (same pattern as Protocol.sections).
 */
@ObjectType()
export class TaskChecklistItem {
  @Field(() => String)
  id: string;

  @Field(() => String)
  label: string;

  @Field(() => Boolean)
  done: boolean;
}

/**
 * Short collaboration note on a task ("Notizen" in the task dialog). Append
 * only; the author's display name is snapshotted at write time so notes stay
 * readable even if the membership is later removed.
 */
@ObjectType()
export class TaskNote {
  @Field(() => String)
  id: string;

  @Field(() => String)
  text: string;

  @Field(() => String, { nullable: true })
  authorMembershipId?: string | null;

  @Field(() => String, { nullable: true })
  authorName?: string | null;

  @Field(() => String)
  createdAt: string;
}
