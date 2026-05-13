import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { AddressesService } from './addresses.service';
import { Address } from './entities/address.entity';
import { CreateAddressInput } from './dto/create-address.input';
import { UpdateAddressInput } from './dto/update-address.input';

@Resolver(() => Address)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AddressesResolver {
  constructor(private readonly addressesService: AddressesService) {}

  @Query(() => [Address], { name: 'addressesByOrgId' })
  @Permissions('ADDRESS_READ')
  findAll(@CurrentOrgId() orgId: string) {
    return this.addressesService.findAllByOrgId(orgId);
  }

  @Query(() => Address, { name: 'addressById' })
  @Permissions('ADDRESS_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.addressesService.findOne(id, orgId);
  }

  @Mutation(() => Address)
  @Permissions('ADDRESS_WRITE')
  createAddress(
    @Args('input') input: CreateAddressInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.addressesService.create(input, orgId);
  }

  @Mutation(() => Address)
  @Permissions('ADDRESS_WRITE')
  updateAddress(
    @Args('input') input: UpdateAddressInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.addressesService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('ADDRESS_DELETE')
  deleteAddress(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.addressesService.remove(id, orgId);
  }
}
