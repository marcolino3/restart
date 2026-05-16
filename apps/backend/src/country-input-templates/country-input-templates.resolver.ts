import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { SuperAdminOnly } from '@/auth/decorators/super-admin.decorator';
import { CountryInputTemplatesService } from './country-input-templates.service';
import {
  CountryInputFieldType,
  CountryInputTemplate,
} from './entities/country-input-template.entity';
import { UpsertCountryInputTemplateInput } from './dto/upsert-country-input-template.input';

@Resolver(() => CountryInputTemplate)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class CountryInputTemplatesResolver {
  constructor(private readonly service: CountryInputTemplatesService) {}

  // Read access is intentionally available to any authenticated user:
  // form fields (Phone/SSN masks) in the web app need to load these globally.
  // No tenant data is exposed — all rows are SuperAdmin-managed defaults.
  @Query(() => [CountryInputTemplate], { name: 'countryInputTemplates' })
  findAll() {
    return this.service.findAll();
  }

  @Query(() => CountryInputTemplate, {
    name: 'countryInputTemplate',
    nullable: true,
  })
  findOne(
    @Args('countryCode', { type: () => String }) countryCode: string,
    @Args('fieldType', { type: () => CountryInputFieldType })
    fieldType: CountryInputFieldType,
  ) {
    return this.service.findByCountryAndField(countryCode, fieldType);
  }

  @Mutation(() => CountryInputTemplate)
  @SuperAdminOnly()
  upsertCountryInputTemplate(
    @Args('input') input: UpsertCountryInputTemplateInput,
  ) {
    return this.service.upsert(input);
  }

  @Mutation(() => Boolean)
  @SuperAdminOnly()
  deleteCountryInputTemplate(@Args('id', { type: () => ID }) id: string) {
    return this.service.remove(id);
  }
}
