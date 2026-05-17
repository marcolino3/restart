import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';

@ObjectType()
export class HeatmapStudentOutput {
  @Field(() => ID)
  studentId: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;
}

@ObjectType()
export class HeatmapAreaOutput {
  @Field(() => ID)
  areaId: string;

  @Field()
  areaName: string;
}

@ObjectType()
export class HeatmapCellOutput {
  @Field(() => ID)
  studentId: string;

  @Field(() => ID)
  areaId: string;

  @Field(() => LessonRecordStatus)
  status: LessonRecordStatus;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class ClassroomHeatmapDataOutput {
  @Field(() => [HeatmapStudentOutput])
  students: HeatmapStudentOutput[];

  @Field(() => [HeatmapAreaOutput])
  areas: HeatmapAreaOutput[];

  @Field(() => [HeatmapCellOutput])
  cells: HeatmapCellOutput[];
}
