import { AbstractEntity } from '@/database/abstract.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { IPermission } from '@/permissions/interfaces/permission.interface';
import { RestartModule } from '@/database/enums/restart-module.enum';
import { Column } from 'typeorm';

@ObjectType()
export class Permission
  extends AbstractEntity<Permission>
  implements IPermission
{
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  @Column('enum', { enum: RestartModule, nullable: true })
  module: RestartModule;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  code: string;
}
