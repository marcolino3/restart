import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { ContactPerson } from '@/school-management/contact-persons/entities/contact-person.entity';
import { UseGuards } from '@nestjs/common';
import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CreateFamilyInput } from './dto/create-family.input';
import { UpdateFamilyInput } from './dto/update-family.input';
import { Family } from './entities/family.entity';
import { FamiliesService } from './families.service';

@Resolver(() => Family)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class FamiliesResolver {
  constructor(private readonly familiesService: FamiliesService) {}

  @Query(() => [Family], { name: 'families' })
  @Permissions('FAMILY_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ) {
    return this.familiesService.findAllByOrgId(orgId, search);
  }

  @Query(() => Family, { name: 'familyById' })
  @Permissions('FAMILY_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.familiesService.findOne(id, orgId);
  }

  @Mutation(() => Family)
  @Permissions('FAMILY_WRITE')
  createFamily(
    @Args('input') input: CreateFamilyInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.familiesService.create(input, orgId);
  }

  @Mutation(() => Family)
  @Permissions('FAMILY_WRITE')
  updateFamily(
    @Args('input') input: UpdateFamilyInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.familiesService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('FAMILY_WRITE')
  archiveFamily(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.familiesService.archive(id, orgId);
  }

  @ResolveField(() => [ContactPerson], { name: 'contactPersons' })
  resolveContactPersons(
    @Parent() family: Family,
    @CurrentOrgId() orgId: string,
  ) {
    return this.familiesService.contactPersonsOfFamily(family.id, orgId);
  }
}
