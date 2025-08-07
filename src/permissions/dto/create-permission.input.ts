import { InputType, Field } from '@nestjs/graphql';
import { IPermission } from '@/permissions/interfaces/permission.interface';
import { RestartModule } from '@/database/enums/restart-module.enum';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

@InputType()
export class CreatePermissionInput implements Partial<IPermission> {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => RestartModule, { nullable: true })
  @IsOptional()
  @IsEnum(RestartModule)
  module: RestartModule;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^[\w-]+$/, { message: 'Name darf keine Leerzeichen enthalten' })
  code: string;

  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  isActive: boolean;
}
