import { Resolver } from '@nestjs/graphql';
import { Membership } from './entities/membership.entity';
import { MembershipsService } from './memberships.service';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';

@Resolver(() => Membership)
@UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
export class MembershipsResolver {
  constructor(private readonly membershipsService: MembershipsService) {}
}
