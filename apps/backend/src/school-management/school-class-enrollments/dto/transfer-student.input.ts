import { Field, ID, InputType } from '@nestjs/graphql';
import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class TransferStudentInput {
  @Field(() => ID)
  @IsUUID()
  studentId: string;

  /**
   * Target school class. Pass `null` to remove the student from any class
   * (i.e. only end the current active enrollment, do not create a new one).
   */
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  targetSchoolClassId?: string | null;

  /**
   * Date of the transfer. Defaults to today. The current active enrollment's
   * `leftAt` is set to this date; the new enrollment's `enrolledAt` to the
   * same date.
   */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601({ strict: true })
  transferDate?: string;
}
