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
import { Task } from '@/project-management/tasks/entities/task.entity';
import { CreateProtocolInput } from './dto/create-protocol.input';
import { CreateTasksFromProtocolInput } from './dto/create-tasks-from-protocol.input';
import { UpdateProtocolInput } from './dto/update-protocol.input';
import { Protocol } from './entities/protocol.entity';
import { ProtocolsService } from './protocols.service';

@Resolver(() => Protocol)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ProtocolsResolver {
  constructor(private readonly protocolsService: ProtocolsService) {}

  @Query(() => [Protocol], { name: 'protocolsByOrg' })
  @Permissions('PROTOCOL_READ')
  protocolsByOrg(@CurrentOrgId() orgId: string): Promise<Protocol[]> {
    return this.protocolsService.findAll(orgId);
  }

  @Query(() => Protocol, { name: 'protocolById' })
  @Permissions('PROTOCOL_READ')
  protocolById(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ): Promise<Protocol> {
    return this.protocolsService.findOne(id, orgId);
  }

  @Mutation(() => Protocol)
  @Permissions('PROTOCOL_WRITE')
  createProtocol(
    @Args('input') input: CreateProtocolInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Protocol> {
    return this.protocolsService.create(
      input,
      orgId,
      actingMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  @Mutation(() => Protocol)
  @Permissions('PROTOCOL_WRITE')
  updateProtocol(
    @Args('input') input: UpdateProtocolInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Protocol> {
    return this.protocolsService.update(
      input,
      orgId,
      actingMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  @Mutation(() => Boolean)
  @Permissions('PROTOCOL_DELETE')
  deleteProtocol(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ): Promise<boolean> {
    return this.protocolsService.remove(id, orgId);
  }

  // Turn the protocol's todos into real tasks (assigned → appear in My Tasks).
  @Mutation(() => [Task])
  @Permissions('PROTOCOL_WRITE')
  createTasksFromProtocol(
    @Args('input') input: CreateTasksFromProtocolInput,
    @CurrentOrgId() orgId: string,
  ): Promise<Task[]> {
    return this.protocolsService.createTasksFromProtocol(input, orgId);
  }
}
