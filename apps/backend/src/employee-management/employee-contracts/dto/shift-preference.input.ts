import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsUUID } from 'class-validator';
import { ShiftPreferenceLevel } from '../entities/employee-contract.entity';

@InputType()
export class ShiftPreferenceInput {
  @Field(() => ID)
  @IsUUID()
  shiftId: string;

  @Field(() => ShiftPreferenceLevel)
  @IsEnum(ShiftPreferenceLevel)
  level: ShiftPreferenceLevel;
}
