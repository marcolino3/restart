import { Resolver } from '@nestjs/graphql';
import { Membership } from './entities/membership.entity';
import { MembershipsService } from './memberships.service';

@Resolver(() => Membership)
// @UseGuards(GqlJwtAuthGuard)
export class MembershipsResolver {
  constructor(private readonly membershipsService: MembershipsService) {}
}
