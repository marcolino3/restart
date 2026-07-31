import { InputType, Field, Int, ID } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SchoolClassTeacherInput } from './school-class-teacher.input';

@InputType()
export class CreateSchoolClassInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => [ID], { nullable: true })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  gradeLevelIds?: string[];

  /** Short label for timetables and compact lists, e.g. "P1a". */
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(16)
  shortCode?: string;

  /**
   * Teachers without role or workload — everyone becomes LEAD.
   *
   * Kept for existing callers. When both this and `teachers` are sent,
   * `teachers` wins; sending both is a caller bug rather than a merge.
   */
  @Field(() => [ID], { nullable: true })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  teacherIds?: string[];

  /** Teachers with role and workload — what the class form sends. */
  @Field(() => [SchoolClassTeacherInput], { nullable: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchoolClassTeacherInput)
  @IsOptional()
  teachers?: SchoolClassTeacherInput[];

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color must be a hex color (e.g. #FF5733)',
  })
  color?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  @Min(1)
  maxCapacity?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  room?: string;
}
