import { InputType, Field, Int, ID } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { SchoolClassTeacherRole } from '@/database/enums/school-class-teacher-role.enum';

/**
 * One teacher assignment as sent by the class form.
 *
 * `teacherIds` on the class input stays for callers that only need the people;
 * this is the richer variant carrying role and workload. Validity is not part
 * of the form — the service dates changes from today and closes assignments
 * that disappear, so the history maintains itself.
 */
@InputType()
export class SchoolClassTeacherInput {
  @Field(() => ID)
  @IsUUID()
  employeeId: string;

  @Field(() => SchoolClassTeacherRole, {
    nullable: true,
    defaultValue: SchoolClassTeacherRole.LEAD,
  })
  @IsEnum(SchoolClassTeacherRole)
  @IsOptional()
  role?: SchoolClassTeacherRole;

  /** Share of a full teaching load. Null when the school does not track it. */
  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  workloadPercent?: number | null;

  /**
   * Explicit start date, for backdating an assignment that began earlier.
   * Defaults to today.
   */
  @Field(() => String, { nullable: true })
  @IsISO8601({ strict: true })
  @IsOptional()
  validFrom?: string;
}
