import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { ProjectMember } from '@/project-management/project-members/entities/project-member.entity';
import { ProjectAccessService } from '@/project-management/projects/project-access.service';
import { CreateTaskInput } from './dto/create-task.input';
import { MoveTaskInput } from './dto/move-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { TaskAssignee } from './entities/task-assignee.entity';
import { Task } from './entities/task.entity';

const TASK_RELATIONS = {
  assignees: { membership: { user: true } },
} as const;

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(TaskAssignee)
    private readonly assigneesRepo: Repository<TaskAssignee>,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
    private readonly access: ProjectAccessService,
    private readonly dataSource: DataSource,
  ) {}

  async findByProject(
    projectId: string,
    organizationId: string,
    membershipId: string,
    canSeeAll: boolean,
  ): Promise<Task[]> {
    await this.access.assertCanView(
      organizationId,
      projectId,
      membershipId,
      canSeeAll,
    );
    return this.tasksRepo.find({
      where: { projectId, organizationId, isActive: true },
      relations: TASK_RELATIONS,
      order: { status: 'ASC', sortOrder: 'ASC' },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
    membershipId: string,
    canSeeAll: boolean,
  ): Promise<Task> {
    const task = await this.loadTask(id, organizationId);
    await this.access.assertCanView(
      organizationId,
      task.projectId,
      membershipId,
      canSeeAll,
    );
    return this.tasksRepo.findOneOrFail({
      where: { id, organizationId, isActive: true },
      relations: TASK_RELATIONS,
    });
  }

  /** All tasks assigned to the caller across every project (personal to-do). */
  async findAssignedTo(
    organizationId: string,
    membershipId: string,
  ): Promise<Task[]> {
    const rows = await this.assigneesRepo.find({
      where: { organizationId, membershipId, isActive: true },
      select: ['taskId'],
    });
    const taskIds = rows.map((r) => r.taskId);
    if (taskIds.length === 0) return [];

    return this.tasksRepo.find({
      where: { id: In(taskIds), organizationId, isActive: true },
      relations: { ...TASK_RELATIONS, project: true },
      order: { dueDate: 'ASC' },
    });
  }

  async create(
    input: CreateTaskInput,
    organizationId: string,
    membershipId: string,
    canSeeAll: boolean,
  ): Promise<Task> {
    await this.access.assertCanEditTasks(
      organizationId,
      input.projectId,
      membershipId,
      canSeeAll,
    );

    const assigneeIds = await this.validateAssignees(
      input.assigneeMembershipIds ?? [],
      input.projectId,
      organizationId,
    );

    return this.dataSource.transaction(async (manager) => {
      const sortOrder = await this.nextSortOrder(
        manager,
        input.projectId,
        input.status ?? undefined,
      );
      const task = await manager.getRepository(Task).save(
        manager.getRepository(Task).create({
          title: input.title.trim(),
          description: input.description ?? null,
          status: input.status,
          priority: input.priority,
          dueDate: input.dueDate ?? null,
          sortOrder,
          organizationId,
          projectId: input.projectId,
          createdByMembershipId: membershipId,
        }),
      );
      await this.replaceAssignees(manager, task, assigneeIds, organizationId);
      return task;
    });
  }

  async update(
    input: UpdateTaskInput,
    organizationId: string,
    membershipId: string,
    canSeeAll: boolean,
  ): Promise<Task> {
    const task = await this.loadTask(input.id, organizationId);
    await this.access.assertCanEditTasks(
      organizationId,
      task.projectId,
      membershipId,
      canSeeAll,
    );

    const assigneeIds =
      input.assigneeMembershipIds !== undefined
        ? await this.validateAssignees(
            input.assigneeMembershipIds,
            task.projectId,
            organizationId,
          )
        : undefined;

    return this.dataSource.transaction(async (manager) => {
      if (input.title !== undefined) task.title = input.title.trim();
      if (input.description !== undefined)
        task.description = input.description ?? null;
      if (input.status !== undefined) task.status = input.status;
      if (input.priority !== undefined) task.priority = input.priority;
      if (input.dueDate !== undefined) task.dueDate = input.dueDate ?? null;
      await manager.getRepository(Task).save(task);

      if (assigneeIds !== undefined) {
        await this.replaceAssignees(manager, task, assigneeIds, organizationId);
      }
      return task;
    });
  }

  /** Move a task to a status column and re-sort that column. */
  async move(
    input: MoveTaskInput,
    organizationId: string,
    membershipId: string,
    canSeeAll: boolean,
  ): Promise<Task> {
    const task = await this.loadTask(input.id, organizationId);
    await this.access.assertCanEditTasks(
      organizationId,
      task.projectId,
      membershipId,
      canSeeAll,
    );

    if (!input.orderedTaskIds.includes(input.id)) {
      throw new BadRequestException(
        'orderedTaskIds must contain the moved task',
      );
    }

    // All reordered tasks must belong to the same project (no cross-project /
    // cross-tenant reshuffling).
    const siblings = await this.tasksRepo.find({
      where: {
        id: In(input.orderedTaskIds),
        projectId: task.projectId,
        organizationId,
        isActive: true,
      },
    });
    if (siblings.length !== input.orderedTaskIds.length) {
      throw new BadRequestException(
        'One or more tasks do not belong to this project',
      );
    }

    const byId = new Map(siblings.map((t) => [t.id, t]));
    const toSave = input.orderedTaskIds.map((id, index) => {
      const sibling = byId.get(id)!;
      sibling.sortOrder = index;
      sibling.status = input.status;
      return sibling;
    });
    await this.tasksRepo.save(toSave);
    return this.findOne(input.id, organizationId, membershipId, canSeeAll);
  }

  async remove(
    id: string,
    organizationId: string,
    membershipId: string,
    canSeeAll: boolean,
  ): Promise<boolean> {
    const task = await this.loadTask(id, organizationId);
    await this.access.assertCanEditTasks(
      organizationId,
      task.projectId,
      membershipId,
      canSeeAll,
    );
    task.isActive = false;
    await this.tasksRepo.save(task);
    return true;
  }

  private async loadTask(id: string, organizationId: string): Promise<Task> {
    const task = await this.tasksRepo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  private async nextSortOrder(
    manager: EntityManager,
    projectId: string,
    status: Task['status'] | undefined,
  ): Promise<number> {
    const qb = manager
      .getRepository(Task)
      .createQueryBuilder('task')
      .select('COALESCE(MAX(task.sort_order), -1)', 'max')
      .where('task.project_id = :projectId', { projectId })
      .andWhere('task."isActive" = true');
    if (status) qb.andWhere('task.status = :status', { status });
    const row = await qb.getRawOne<{ max: number }>();
    return Number(row?.max ?? -1) + 1;
  }

  /**
   * Assignees must be active members of the task's project (which also pins them
   * to the same organization). Returns the deduped ids.
   */
  private async validateAssignees(
    membershipIds: string[],
    projectId: string,
    organizationId: string,
  ): Promise<string[]> {
    const unique = [...new Set(membershipIds)];
    if (unique.length === 0) return [];

    const members = await this.membersRepo.find({
      where: {
        projectId,
        organizationId,
        membershipId: In(unique),
        isActive: true,
      },
      select: ['membershipId'],
    });
    if (members.length !== unique.length) {
      throw new BadRequestException(
        'All assignees must be members of the project',
      );
    }
    return unique;
  }

  private async replaceAssignees(
    manager: EntityManager,
    task: Task,
    membershipIds: string[],
    organizationId: string,
  ): Promise<void> {
    await manager.getRepository(TaskAssignee).delete({ taskId: task.id });
    if (membershipIds.length === 0) return;
    await manager.getRepository(TaskAssignee).save(
      membershipIds.map((membershipId) =>
        manager.getRepository(TaskAssignee).create({
          organizationId,
          taskId: task.id,
          membershipId,
        }),
      ),
    );
  }
}
