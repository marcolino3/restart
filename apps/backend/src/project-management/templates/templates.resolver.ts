import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  actingMembershipId,
  canSeeAllProjects,
} from '@/project-management/common/project-auth';
import { Project } from '@/project-management/projects/entities/project.entity';
import { CreateProjectFromTemplateInput } from './dto/create-project-from-template.input';
import { CreateProjectTemplateInput } from './dto/create-project-template.input';
import { SaveProjectAsTemplateInput } from './dto/save-project-as-template.input';
import { UpdateProjectTemplateInput } from './dto/update-project-template.input';
import { ProjectTemplate } from './entities/project-template.entity';
import { TemplatesService } from './templates.service';

@Resolver(() => ProjectTemplate)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class TemplatesResolver {
  constructor(private readonly templatesService: TemplatesService) {}

  @Query(() => [ProjectTemplate], { name: 'projectTemplates' })
  @Permissions('PROJECT_READ')
  projectTemplates(@CurrentOrgId() orgId: string): Promise<ProjectTemplate[]> {
    return this.templatesService.findAll(orgId);
  }

  @Query(() => ProjectTemplate, { name: 'projectTemplateById' })
  @Permissions('PROJECT_READ')
  projectTemplateById(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ): Promise<ProjectTemplate> {
    return this.templatesService.findOne(id, orgId);
  }

  @Mutation(() => ProjectTemplate)
  @Permissions('PROJECT_TEMPLATE_MANAGE')
  createProjectTemplate(
    @Args('input') input: CreateProjectTemplateInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<ProjectTemplate> {
    return this.templatesService.create(input, orgId, actingMembershipId(user));
  }

  @Mutation(() => ProjectTemplate)
  @Permissions('PROJECT_TEMPLATE_MANAGE')
  updateProjectTemplate(
    @Args('input') input: UpdateProjectTemplateInput,
    @CurrentOrgId() orgId: string,
  ): Promise<ProjectTemplate> {
    return this.templatesService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('PROJECT_TEMPLATE_MANAGE')
  deleteProjectTemplate(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ): Promise<boolean> {
    return this.templatesService.remove(id, orgId);
  }

  // Instantiating a template is a normal project creation — gated by
  // PROJECT_CREATE, available to any member.
  @Mutation(() => Project)
  @Permissions('PROJECT_CREATE')
  createProjectFromTemplate(
    @Args('input') input: CreateProjectFromTemplateInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Project> {
    return this.templatesService.instantiate(
      input,
      orgId,
      actingMembershipId(user),
    );
  }

  @Mutation(() => ProjectTemplate)
  @Permissions('PROJECT_TEMPLATE_MANAGE')
  saveProjectAsTemplate(
    @Args('input') input: SaveProjectAsTemplateInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<ProjectTemplate> {
    return this.templatesService.saveProjectAsTemplate(
      input,
      orgId,
      actingMembershipId(user),
      canSeeAllProjects(user),
    );
  }
}
