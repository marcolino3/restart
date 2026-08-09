import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateEmailTemplateInput } from './dto/create-email-template.input';
import { UpdateEmailTemplateInput } from './dto/update-email-template.input';
import { EmailTemplatesService } from './email-templates.service';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailTemplateCategory } from './enums/email-template-category.enum';

@Resolver(() => EmailTemplate)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class EmailTemplatesResolver {
  constructor(private readonly templates: EmailTemplatesService) {}

  @Query(() => [EmailTemplate], { name: 'emailTemplates' })
  @Permissions('ADMISSION_APPLICATION_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('category', { type: () => EmailTemplateCategory, nullable: true })
    category?: EmailTemplateCategory,
  ) {
    return this.templates.findForOrg(orgId, category);
  }

  @Mutation(() => EmailTemplate)
  @Permissions('ADMISSION_EMAIL_TEMPLATE_MANAGE')
  createEmailTemplate(
    @Args('input') input: CreateEmailTemplateInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() membershipId: string | null,
  ) {
    return this.templates.create(input, orgId, membershipId);
  }

  @Mutation(() => EmailTemplate)
  @Permissions('ADMISSION_EMAIL_TEMPLATE_MANAGE')
  updateEmailTemplate(
    @Args('input') input: UpdateEmailTemplateInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.templates.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('ADMISSION_EMAIL_TEMPLATE_MANAGE')
  deleteEmailTemplate(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.templates.remove(id, orgId);
  }
}
