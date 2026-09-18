import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ContractAiService } from './contract-ai.service';
import { ContractTemplatesService } from './contract-templates.service';
import { ContractAiChatInput } from './dto/contract-ai-chat.input';
import { ContractAiChatResult } from './dto/contract-ai-chat.output';
import { ContractDocumentPreview } from './dto/contract-document-preview.output';
import { CreateContractTemplateInput } from './dto/create-contract-template.input';
import { UpdateContractTemplateInput } from './dto/update-contract-template.input';
import { ContractTemplate } from './entities/contract-template.entity';

@Resolver(() => ContractTemplate)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ContractTemplatesResolver {
  constructor(
    private readonly templates: ContractTemplatesService,
    private readonly ai: ContractAiService,
  ) {}

  @Query(() => Boolean, { name: 'contractAiConfigured' })
  @Permissions('EMPLOYEE_READ')
  contractAiConfigured(@CurrentOrgId() orgId: string) {
    return this.ai.isConfigured(orgId);
  }

  @Mutation(() => ContractAiChatResult)
  @Permissions('EMPLOYEE_WRITE')
  async contractAiChat(
    @Args('input') input: ContractAiChatInput,
    @CurrentOrgId() orgId: string,
  ) {
    // Org-scoped load — a foreign-org contract id must fail before any AI call.
    const contract = input.contractId
      ? await this.templates.loadContractForOrg(input.contractId, orgId)
      : null;
    return this.ai.chatDialog(
      orgId,
      input.messages,
      input.currentHtml ?? null,
      contract,
    );
  }

  @Query(() => [ContractTemplate], { name: 'contractTemplates' })
  @Permissions('EMPLOYEE_READ')
  findAll(@CurrentOrgId() orgId: string) {
    return this.templates.findForOrg(orgId);
  }

  @Query(() => ContractDocumentPreview, { name: 'previewContractDocument' })
  @Permissions('EMPLOYEE_WRITE')
  preview(
    @Args('contractId', { type: () => ID }) contractId: string,
    @Args('templateId', { type: () => ID }) templateId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.templates.preview(contractId, templateId, orgId);
  }

  @Mutation(() => ContractTemplate)
  @Permissions('EMPLOYEE_WRITE')
  createContractTemplate(
    @Args('input') input: CreateContractTemplateInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() membershipId: string | null,
  ) {
    return this.templates.create(input, orgId, membershipId);
  }

  @Mutation(() => ContractTemplate)
  @Permissions('EMPLOYEE_WRITE')
  updateContractTemplate(
    @Args('input') input: UpdateContractTemplateInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.templates.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('EMPLOYEE_WRITE')
  deleteContractTemplate(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.templates.remove(id, orgId);
  }
}
