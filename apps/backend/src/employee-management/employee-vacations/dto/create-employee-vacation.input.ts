import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EmployeeVacationAccrualType } from '../entities/employee-vacation-accrual-type.enum';

@InputType()
export class CreateEmployeeVacationInput {
  @Field(() => ID)
  @IsUUID()
  employeeId: string;

  @Field(() => String)
  @IsDateString()
  startDate: string;

  @Field(() => String)
  @IsDateString()
  endDate: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => EmployeeVacationAccrualType, { nullable: true })
  @IsOptional()
  @IsEnum(EmployeeVacationAccrualType)
  accrualType?: EmployeeVacationAccrualType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  remark?: string;
}
