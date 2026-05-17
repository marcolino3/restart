import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

@InputType()
export class SetLessonPrerequisitesInput {
  @Field(() => ID)
  @IsUUID()
  lessonId: string;

  @Field(() => [ID])
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  prerequisiteIds: string[];
}
