import { Field, InputType } from '@nestjs/graphql';
import { ArrayUnique, IsArray, IsIn } from 'class-validator';
import { ADMISSION_TABLE_COLUMN_KEYS } from '../../admission-stages/admission-field-keys';

@InputType()
export class UpdateAdmissionBoardSettingsInput {
  @Field(() => [String])
  @IsArray()
  @ArrayUnique()
  @IsIn([...ADMISSION_TABLE_COLUMN_KEYS], { each: true })
  tableColumns: string[];
}
