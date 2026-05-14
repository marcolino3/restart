import { Resolver, Query } from '@nestjs/graphql';
import { PermissionsService } from './permissions.service';
import { Permission } from './entities/permission.entity';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';

@Resolver(() => Permission)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class PermissionsResolver {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Query(() => [Permission], { name: 'permissions' })
  findAll() {
    return this.permissionsService.findAll();
  }
}
