import { InputType, Field, ID } from '@nestjs/graphql';
import {
  ArrayMaxSize,
  IsIn,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { FieldAction } from '@restart/shared-schemas/rbac/field-catalog';

@InputType()
export class RoleFieldPermissionEntryInput {
  @Field(() => String)
  @IsString()
  @MaxLength(100)
  resource!: string;

  @Field(() => String)
  @IsString()
  @MaxLength(100)
  field!: string;

  @Field(() => [String])
  @ArrayMaxSize(4)
  @IsIn(['create', 'read', 'update', 'delete'], { each: true })
  actions!: FieldAction[];
}

@InputType()
export class UpdateRoleFieldPermissionsInput {
  @Field(() => ID)
  @IsUUID('4')
  roleId!: string;

  @Field(() => [RoleFieldPermissionEntryInput])
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => RoleFieldPermissionEntryInput)
  fieldPermissions!: RoleFieldPermissionEntryInput[];
}
