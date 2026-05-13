import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Curriculum } from '../entities/curriculum.entity';
import { CurriculaImportService } from './curricula-import.service';
import { ImportCurriculumPlanInput } from './dto/import-curriculum-plan.input';

@Resolver(() => Curriculum)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class CurriculaImportResolver {
  constructor(private readonly service: CurriculaImportService) {}

  @Mutation(() => Curriculum)
  @Permissions('CURRICULUM_MANAGE')
  importCurriculumFromPlan(
    @Args('input') input: ImportCurriculumPlanInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.applyPlan(input, orgId);
  }
}
