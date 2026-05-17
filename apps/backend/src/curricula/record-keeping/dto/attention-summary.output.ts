import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum AttentionReason {
  NEEDS_MORE_CURRENT = 'NEEDS_MORE_CURRENT',
  REPEATED_NEEDS_MORE = 'REPEATED_NEEDS_MORE',
  STUCK_PRACTICED = 'STUCK_PRACTICED',
  STUCK_INTRODUCED = 'STUCK_INTRODUCED',
  BIG_GAP_INTRO_TO_PRACTICED = 'BIG_GAP_INTRO_TO_PRACTICED',
}

registerEnumType(AttentionReason, { name: 'AttentionReason' });

@ObjectType()
export class AttentionAncestor {
  @Field()
  id: string;

  @Field()
  nodeType: string;

  @Field(() => [AttentionAncestorTranslation])
  translations: AttentionAncestorTranslation[];
}

@ObjectType()
export class AttentionAncestorTranslation {
  @Field()
  locale: string;

  @Field()
  name: string;
}

@ObjectType()
export class AttentionItemOutput {
  @Field()
  lessonId: string;

  @Field()
  lessonName: string;

  @Field(() => [AttentionAncestor])
  ancestors: AttentionAncestor[];

  @Field(() => AttentionReason)
  reason: AttentionReason;

  @Field(() => Int)
  severity: number;

  @Field(() => Int, { nullable: true })
  days: number | null;

  @Field(() => String, { nullable: true })
  since: string | null;
}

@ObjectType()
export class AttentionReasonCounts {
  @Field(() => Int)
  NEEDS_MORE_CURRENT: number;

  @Field(() => Int)
  REPEATED_NEEDS_MORE: number;

  @Field(() => Int)
  STUCK_PRACTICED: number;

  @Field(() => Int)
  STUCK_INTRODUCED: number;

  @Field(() => Int)
  BIG_GAP_INTRO_TO_PRACTICED: number;
}

@ObjectType()
export class StudentAttentionSummaryOutput {
  @Field()
  studentId: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => Int)
  totalSignals: number;

  @Field(() => [AttentionItemOutput])
  topItems: AttentionItemOutput[];

  @Field(() => AttentionReasonCounts)
  byReason: AttentionReasonCounts;
}
