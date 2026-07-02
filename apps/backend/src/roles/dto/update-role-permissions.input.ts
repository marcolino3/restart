import { InputType, Field, ID } from '@nestjs/graphql';
import { ArrayMaxSize, IsEnum, IsUUID } from 'class-validator';
import { PermissionCode } from '@/permissions/entities/permission-code.enum';

@InputType()
export class UpdateRolePermissionsInput {
  @Field(() => ID)
  @IsUUID('4')
  roleId: string;

  @Field(() => [String])
  @ArrayMaxSize(100)
  @IsEnum(PermissionCode, { each: true })
  permissionCodes: string[];
}
