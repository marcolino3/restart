import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CountriesService } from './countries.service';
import { Country } from './entities/country.entity';
import { CreateCountryInput } from './dto/create-country.input';
import { UpdateCountryInput } from './dto/update-country.input';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';

// Countries are global reference data (no org scoping): reads require an
// authenticated session, writes are SuperAdmin-only.
@Resolver(() => Country)
@UseGuards(GqlBetterAuthGuard)
export class CountriesResolver {
  constructor(private readonly countriesService: CountriesService) {}

  @Mutation(() => Country)
  @UseGuards(SuperAdminGuard)
  createCountry(
    @Args('createCountryInput') createCountryInput: CreateCountryInput,
  ) {
    return this.countriesService.create(createCountryInput);
  }

  @Query(() => [Country], { name: 'countries' })
  findAll() {
    return this.countriesService.findAll();
  }

  @Query(() => Country, { name: 'country' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.countriesService.findOne(id);
  }

  @Mutation(() => Country)
  @UseGuards(SuperAdminGuard)
  updateCountry(
    @Args('updateCountryInput') updateCountryInput: UpdateCountryInput,
  ) {
    return this.countriesService.update(
      updateCountryInput.id,
      updateCountryInput,
    );
  }

  @Mutation(() => Country)
  @UseGuards(SuperAdminGuard)
  removeCountry(@Args('id', { type: () => Int }) id: number) {
    return this.countriesService.remove(id);
  }
}
