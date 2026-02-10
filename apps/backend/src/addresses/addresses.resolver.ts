import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AddressesService } from './addresses.service';
import { Address } from './entities/address.entity';
import { CreateAddressInput } from './dto/create-address.input';
import { UpdateAddressInput } from './dto/update-address.input';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';

@Resolver(() => Address)
@UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
export class AddressesResolver {
  constructor(private readonly addressesService: AddressesService) {}

  @Mutation(() => Address)
  @Permissions('EMPLOYEE_WRITE')
  createAddress(@Args('createAddressInput') createAddressInput: CreateAddressInput) {
    return this.addressesService.create(createAddressInput);
  }

  @Query(() => [Address], { name: 'addresses' })
  findAll() {
    return this.addressesService.findAll();
  }

  @Query(() => Address, { name: 'address' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.addressesService.findOne(id);
  }

  @Mutation(() => Address)
  @Permissions('EMPLOYEE_WRITE')
  updateAddress(@Args('updateAddressInput') updateAddressInput: UpdateAddressInput) {
    return this.addressesService.update(updateAddressInput.id, updateAddressInput);
  }

  @Mutation(() => Address)
  @Permissions('EMPLOYEE_WRITE')
  removeAddress(@Args('id', { type: () => Int }) id: number) {
    return this.addressesService.remove(id);
  }
}
