import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AreaLessonCount {
  @Field(() => ID)
  areaId: string;

  @Field(() => Int)
  lessonCount: number;

  @Field(() => ID, { nullable: true })
  curriculumId?: string | null;

  @Field(() => String, { nullable: true })
  curriculumName?: string | null;
}
