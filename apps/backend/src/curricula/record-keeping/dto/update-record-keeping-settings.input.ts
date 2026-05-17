import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, Max, Min } from 'class-validator';

@InputType()
export class UpdateRecordKeepingSettingsInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(3650)
  introducedStuckDays: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(3650)
  practicedStuckDays: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(3650)
  bigGapDays: number;
}
