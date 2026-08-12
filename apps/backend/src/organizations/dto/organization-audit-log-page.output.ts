import { Field, Int, ObjectType } from '@nestjs/graphql';

import { OrganizationAuditLog } from '@/organizations/entities/organization-audit-log.entity';

@ObjectType()
export class OrganizationAuditLogPage {
  @Field(() => [OrganizationAuditLog])
  items: OrganizationAuditLog[];

  @Field(() => Int)
  total: number;
}
