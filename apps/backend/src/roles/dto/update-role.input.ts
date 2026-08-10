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
export class UpdateRoleInput {
  @Field(() => ID)
  @IsUUID('4')
  id!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

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
}
