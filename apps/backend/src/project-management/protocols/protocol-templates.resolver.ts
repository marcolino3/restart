import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { actingMembershipId } from '@/project-management/common/project-auth';
import { CreateProtocolTemplateInput } from './dto/create-protocol-template.input';
import { SaveProtocolAsTemplateInput } from './dto/save-protocol-as-template.input';
import { UpdateProtocolTemplateInput } from './dto/update-protocol-template.input';
import { ProtocolTemplate } from './entities/protocol-template.entity';
import { ProtocolTemplatesService } from './protocol-templates.service';

@Resolver(() => ProtocolTemplate)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ProtocolTemplatesResolver {
  constructor(private readonly templatesService: ProtocolTemplatesService) {}

  @Query(() => [ProtocolTemplate], { name: 'protocolTemplatesByOrg' })
  @Permissions('PROTOCOL_READ')
  protocolTemplatesByOrg(
    @CurrentOrgId() orgId: string,
  ): Promise<ProtocolTemplate[]> {
    return this.templatesService.findAll(orgId);
  }

  @Mutation(() => ProtocolTemplate)
  @Permissions('PROTOCOL_WRITE')
  createProtocolTemplate(
    @Args('input') input: CreateProtocolTemplateInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<ProtocolTemplate> {
    return this.templatesService.create(input, orgId, actingMembershipId(user));
  }

  @Mutation(() => ProtocolTemplate)
  @Permissions('PROTOCOL_WRITE')
  updateProtocolTemplate(
    @Args('input') input: UpdateProtocolTemplateInput,
    @CurrentOrgId() orgId: string,
  ): Promise<ProtocolTemplate> {
    return this.templatesService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('PROTOCOL_WRITE')
  deleteProtocolTemplate(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ): Promise<boolean> {
    return this.templatesService.remove(id, orgId);
  }

  @Mutation(() => ProtocolTemplate)
  @Permissions('PROTOCOL_WRITE')
  saveProtocolAsTemplate(
    @Args('input') input: SaveProtocolAsTemplateInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<ProtocolTemplate> {
    return this.templatesService.saveProtocolAsTemplate(
      input,
      orgId,
      actingMembershipId(user),
    );
  }
}
