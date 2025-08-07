import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IPermission } from '@/permissions/interfaces/permission.interface';
import { CreatePermissionInput } from './create-permission.input';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class UpdatePermissionInput
  extends PartialType(CreatePermissionInput)
  implements Partial<IPermission>
{
  @Field(() => ID)
  @IsString()
  @IsUUID('4')
  id: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
