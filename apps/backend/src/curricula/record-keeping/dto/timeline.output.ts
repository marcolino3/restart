import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum TimelineGranularity {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

registerEnumType(TimelineGranularity, {
  name: 'TimelineGranularity',
  description: 'Bucketing granularity for timeline aggregates.',
});

@ObjectType()
export class StudentTimelineBucketOutput {
  @Field(() => String)
  bucketStart: string;

  @Field(() => Int)
  planning: number;

  @Field(() => Int)
  introduced: number;

  @Field(() => Int)
  practiced: number;

  @Field(() => Int)
  mastered: number;

  @Field(() => Int)
  needsMore: number;

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class StudentTimelineOutput {
  @Field(() => [StudentTimelineBucketOutput])
  buckets: StudentTimelineBucketOutput[];

  @Field(() => Int)
  totalIntroductionsInRange: number;

  @Field(() => Int, { nullable: true })
  daysSinceLastIntroduction: number | null;
}

@ObjectType()
export class EngagementTimelineBucketOutput {
  @Field(() => String)
  bucketStart: string;

  @Field(() => Int)
  focused: number;

  @Field(() => Int)
  interested: number;

  @Field(() => Int)
  mechanical: number;

  @Field(() => Int)
  resistant: number;

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class EngagementTimelineOutput {
  @Field(() => [EngagementTimelineBucketOutput])
  buckets: EngagementTimelineBucketOutput[];

  @Field(() => Int)
  totalObserved: number;
}
