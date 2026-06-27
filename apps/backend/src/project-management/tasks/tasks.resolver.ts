import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  canSeeAllProjects,
  actingMembershipId,
} from '@/project-management/common/project-auth';
import { CreateTaskInput } from './dto/create-task.input';
import { MoveTaskInput } from './dto/move-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';

@Resolver(() => Task)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class TasksResolver {
  constructor(private readonly tasksService: TasksService) {}

  @Query(() => [Task], { name: 'tasksByProject' })
  @Permissions('PROJECT_READ')
  tasksByProject(
    @Args('projectId', { type: () => ID }) projectId: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Task[]> {
    return this.tasksService.findByProject(
      projectId,
      orgId,
      actingMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  @Query(() => Task, { name: 'taskById' })
  @Permissions('PROJECT_READ')
  taskById(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Task> {
    return this.tasksService.findOne(
      id,
      orgId,
      actingMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  // The caller's personal cross-project to-do list: every task assigned to them.
  @Query(() => [Task], { name: 'myTasks' })
  @Permissions('PROJECT_READ')
  myTasks(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Task[]> {
    return this.tasksService.findAssignedTo(orgId, actingMembershipId(user));
  }

  @Mutation(() => Task)
  @Permissions('PROJECT_READ')
  createTask(
    @Args('input') input: CreateTaskInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Task> {
    return this.tasksService.create(
      input,
      orgId,
      actingMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  @Mutation(() => Task)
  @Permissions('PROJECT_READ')
  updateTask(
    @Args('input') input: UpdateTaskInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Task> {
    return this.tasksService.update(
      input,
      orgId,
      actingMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  @Mutation(() => Task)
  @Permissions('PROJECT_READ')
  moveTask(
    @Args('input') input: MoveTaskInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Task> {
    return this.tasksService.move(
      input,
      orgId,
      actingMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  @Mutation(() => Boolean)
  @Permissions('PROJECT_READ')
  deleteTask(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<boolean> {
    return this.tasksService.remove(
      id,
      orgId,
      actingMembershipId(user),
      canSeeAllProjects(user),
    );
  }
}
