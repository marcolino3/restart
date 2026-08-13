import { InputType, Field, ID } from '@nestjs/graphql';
import {
  ArrayMaxSize,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PermissionCode } from '@/permissions/entities/permission-code.enum';

@InputType()
export class CreateRoleInput {
  @Field(() => String)
  @IsString()
  @MaxLength(100)
  name!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @ArrayMaxSize(100)
  @IsEnum(PermissionCode, { each: true })
  permissionCodes?: string[];

  // When set, permissions and field permissions are copied from this role
  // ("copy as template"). Must belong to the same org (enforced in service).
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID('4')
  duplicateFromRoleId?: string;

  // Memberships to assign this role to immediately after creation. Must
  // belong to the same org (enforced in service).
  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  membershipIds?: string[];
}
