import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { ProjectMember } from '@/project-management/project-members/entities/project-member.entity';
import { ProjectAccessService } from '@/project-management/projects/project-access.service';
import { AddTaskNoteInput } from './dto/add-task-note.input';
import { CreateTaskInput } from './dto/create-task.input';
import { MoveTaskInput } from './dto/move-task.input';
import { TaskChecklistItemInput } from './dto/task-checklist-item.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { TaskAssignee } from './entities/task-assignee.entity';
import { TaskChecklistItem } from './entities/task-details.output';
import { Task } from './entities/task.entity';
import { TaskStatus } from './entities/task-status.enum';

const TASK_RELATIONS = {
  assignees: { membership: { user: true } },
} as const;

const MY_TASK_RELATIONS = {
  assignees: { membership: { user: true } },
  project: true,
  // Source of an auto-created reminder task — surfaced as a "Aufnahme: <Kind>"
  // link in "My Tasks".
  admissionApplication: true,
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
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
    private readonly access: ProjectAccessService,
    private readonly dataSource: DataSource,
  ) {}

  async findByProject(
    projectId: string,
    organizationId: string,
    membershipId: string | null,
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
    membershipId: string | null,
    canSeeAll: boolean,
  ): Promise<Task> {
    const task = await this.loadTask(id, organizationId);
    await this.authorizeView(task, organizationId, membershipId, canSeeAll);
    return this.tasksRepo.findOneOrFail({
      where: { id, organizationId, isActive: true },
      relations: MY_TASK_RELATIONS,
    });
  }

  /**
   * The caller's personal task list: every task assigned to them, across all
   * sources (project tasks, personal tasks, and — later — protocol / meeting
   * tasks). Personal tasks are auto-assigned to their creator, so they appear
   * here too. Strictly "assigned to me" — never other tasks.
   */
  async findAssignedTo(
    organizationId: string,
    membershipId: string | null,
  ): Promise<Task[]> {
    if (!membershipId) return [];
    const assigned = await this.assigneesRepo.find({
      where: { organizationId, membershipId, isActive: true },
      order: { sortOrder: 'ASC' },
      select: ['taskId', 'sortOrder'],
    });
    const orderedIds = assigned.map((r) => r.taskId);
    if (orderedIds.length === 0) return [];

    const tasks = await this.tasksRepo.find({
      where: { id: In(orderedIds), organizationId, isActive: true },
      relations: MY_TASK_RELATIONS,
    });
    // Preserve the caller's personal order (assignee.sortOrder).
    const rank = new Map(orderedIds.map((id, i) => [id, i]));
    return tasks.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  }

  /**
   * Persist the caller's personal ordering of their assigned tasks (drag-and-drop
   * in "My Tasks"). Only reorders the caller's own assignee rows.
   */
  async reorderAssigned(
    organizationId: string,
    membershipId: string | null,
    orderedTaskIds: string[],
  ): Promise<boolean> {
    if (!membershipId) {
      throw new BadRequestException('No active membership');
    }
    const assignees = await this.assigneesRepo.find({
      where: {
        organizationId,
        membershipId,
        taskId: In(orderedTaskIds),
        isActive: true,
      },
    });
    if (assignees.length !== orderedTaskIds.length) {
      throw new BadRequestException(
        'One or more tasks are not assigned to you',
      );
    }
    const byTask = new Map(assignees.map((a) => [a.taskId, a]));
    const toSave = orderedTaskIds.map((taskId, index) => {
      const assignee = byTask.get(taskId)!;
      assignee.sortOrder = index;
      return assignee;
    });
    await this.assigneesRepo.save(toSave);
    return true;
  }

  /** Tasks created from a given protocol (org-scoped). */
  async findByProtocol(
    protocolId: string,
    organizationId: string,
  ): Promise<Task[]> {
    return this.tasksRepo.find({
      where: { protocolId, organizationId, isActive: true },
      relations: MY_TASK_RELATIONS,
      order: { createdAt: 'ASC' },
    });
  }

  async create(
    input: CreateTaskInput,
    organizationId: string,
    membershipId: string | null,
    canSeeAll: boolean,
  ): Promise<Task> {
    // Personal task (no project board): the creator owns it and is its assignee.
    if (!input.projectId) {
      if (!membershipId) {
        throw new BadRequestException(
          'A membership is required to create a personal task',
        );
      }
      return this.dataSource.transaction(async (manager) => {
        const task = await manager.getRepository(Task).save(
          manager.getRepository(Task).create({
            title: input.title.trim(),
            description: input.description ?? null,
            status: input.status,
            priority: input.priority,
            dueDate: input.dueDate ?? null,
            dueTime: input.dueTime ?? null,
            checklist: this.normalizeChecklist(input.checklist ?? []),
            completedAt: input.status === TaskStatus.DONE ? new Date() : null,
            sortOrder: 0,
            organizationId,
            projectId: null,
            createdByMembershipId: membershipId,
          }),
        );
        await this.replaceAssignees(
          manager,
          task,
          [membershipId],
          organizationId,
        );
        return task;
      });
    }

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
        input.projectId!,
        input.status ?? undefined,
      );
      const task = await manager.getRepository(Task).save(
        manager.getRepository(Task).create({
          title: input.title.trim(),
          description: input.description ?? null,
          status: input.status,
          priority: input.priority,
          dueDate: input.dueDate ?? null,
          dueTime: input.dueTime ?? null,
          checklist: this.normalizeChecklist(input.checklist ?? []),
          completedAt: input.status === TaskStatus.DONE ? new Date() : null,
          sortOrder,
          organizationId,
          projectId: input.projectId,
          createdByMembershipId: membershipId ?? null,
        }),
      );
      await this.replaceAssignees(manager, task, assigneeIds, organizationId);
      return task;
    });
  }

  async update(
    input: UpdateTaskInput,
    organizationId: string,
    membershipId: string | null,
    canSeeAll: boolean,
  ): Promise<Task> {
    const task = await this.loadTask(input.id, organizationId);
    await this.authorizeEdit(task, organizationId, membershipId, canSeeAll);

    // Reassignment is allowed on project tasks (validated against project
    // membership) and on protocol tasks (validated against org membership —
    // typically the meeting participants). A pure personal task stays owned by
    // its creator.
    let assigneeIds: string[] | undefined;
    if (
      input.assigneeMembershipIds !== undefined &&
      (task.projectId || task.protocolId)
    ) {
      assigneeIds = task.projectId
        ? await this.validateAssignees(
            input.assigneeMembershipIds,
            task.projectId,
            organizationId,
          )
        : await this.validateOrgMemberships(
            input.assigneeMembershipIds,
            organizationId,
          );
    }

    return this.dataSource.transaction(async (manager) => {
      if (input.title !== undefined) task.title = input.title.trim();
      if (input.description !== undefined)
        task.description = input.description ?? null;
      if (input.status !== undefined)
        this.applyStatusTransition(task, input.status);
      if (input.priority !== undefined) task.priority = input.priority;
      if (input.dueDate !== undefined) task.dueDate = input.dueDate ?? null;
      if (input.dueTime !== undefined) task.dueTime = input.dueTime ?? null;
      if (input.checklist !== undefined)
        task.checklist = this.normalizeChecklist(input.checklist ?? []);
      await manager.getRepository(Task).save(task);

      if (assigneeIds !== undefined) {
        await this.replaceAssignees(manager, task, assigneeIds, organizationId);
      }
      return task;
    });
  }

  /** Move a task to a status column and re-sort that column (project tasks only). */
  async move(
    input: MoveTaskInput,
    organizationId: string,
    membershipId: string | null,
    canSeeAll: boolean,
  ): Promise<Task> {
    const task = await this.loadTask(input.id, organizationId);
    if (!task.projectId) {
      throw new BadRequestException('Personal tasks have no board to move on');
    }
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
      this.applyStatusTransition(sibling, input.status);
      return sibling;
    });
    await this.tasksRepo.save(toSave);
    return this.findOne(input.id, organizationId, membershipId, canSeeAll);
  }

  /**
   * Append a note to a task. The author's display name is snapshotted so the
   * note stays attributable even if the membership is later removed.
   */
  async addNote(
    input: AddTaskNoteInput,
    organizationId: string,
    membershipId: string | null,
    canSeeAll: boolean,
  ): Promise<Task> {
    const task = await this.loadTask(input.taskId, organizationId);
    await this.authorizeEdit(task, organizationId, membershipId, canSeeAll);

    let authorName: string | null = null;
    if (membershipId) {
      const membership = await this.membershipsRepo.findOne({
        where: { id: membershipId, organizationId },
        relations: { user: true },
      });
      authorName = membership?.user
        ? `${membership.user.firstName} ${membership.user.lastName}`.trim()
        : null;
    }

    task.notes = [
      ...(task.notes ?? []),
      {
        id: randomUUID(),
        text: input.text.trim(),
        authorMembershipId: membershipId,
        authorName,
        createdAt: new Date().toISOString(),
      },
    ];
    await this.tasksRepo.save(task);
    return this.findOne(task.id, organizationId, membershipId, canSeeAll);
  }

  async remove(
    id: string,
    organizationId: string,
    membershipId: string | null,
    canSeeAll: boolean,
  ): Promise<boolean> {
    const task = await this.loadTask(id, organizationId);
    await this.authorizeEdit(task, organizationId, membershipId, canSeeAll);
    task.isActive = false;
    await this.tasksRepo.save(task);
    return true;
  }

  /** Sets/clears completedAt exactly on the transition into/out of DONE. */
  private applyStatusTransition(task: Task, status: TaskStatus): void {
    if (task.status === status) return;
    task.status = status;
    task.completedAt = status === TaskStatus.DONE ? new Date() : null;
  }

  /** Ensure every checklist entry carries a stable id and a trimmed label. */
  private normalizeChecklist(
    items: TaskChecklistItemInput[],
  ): TaskChecklistItem[] {
    return items
      .map((item) => ({
        id: item.id ?? randomUUID(),
        label: item.label.trim(),
        done: item.done,
      }))
      .filter((item) => item.label.length > 0);
  }

  private async loadTask(id: string, organizationId: string): Promise<Task> {
    const task = await this.tasksRepo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  /** View access: project tasks via project visibility; personal tasks by owner. */
  private async authorizeView(
    task: Task,
    organizationId: string,
    membershipId: string | null,
    canSeeAll: boolean,
  ): Promise<void> {
    if (task.projectId) {
      await this.access.assertCanView(
        organizationId,
        task.projectId,
        membershipId,
        canSeeAll,
      );
      return;
    }
    await this.assertPersonalOwner(task, organizationId, membershipId);
  }

  /** Edit access: project tasks via project membership; personal tasks by owner. */
  private async authorizeEdit(
    task: Task,
    organizationId: string,
    membershipId: string | null,
    canSeeAll: boolean,
  ): Promise<void> {
    if (task.projectId) {
      await this.access.assertCanEditTasks(
        organizationId,
        task.projectId,
        membershipId,
        canSeeAll,
      );
      return;
    }
    await this.assertPersonalOwner(task, organizationId, membershipId);
  }

  /**
   * A personal task (no project) is private: only its creator or an assignee may
   * see/act on it. Non-owners get NotFound (no existence leak). canSeeAll does
   * NOT apply — personal tasks are never exposed org-wide.
   */
  private async assertPersonalOwner(
    task: Task,
    organizationId: string,
    membershipId: string | null,
  ): Promise<void> {
    if (membershipId) {
      if (task.createdByMembershipId === membershipId) return;
      const assignee = await this.assigneesRepo.findOne({
        where: {
          taskId: task.id,
          membershipId,
          organizationId,
          isActive: true,
        },
        select: ['id'],
      });
      if (assignee) return;
    }
    throw new NotFoundException(`Task ${task.id} not found`);
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

  /** Assignees must belong to the organization (for protocol/personal context). */
  private async validateOrgMemberships(
    membershipIds: string[],
    organizationId: string,
  ): Promise<string[]> {
    const unique = [...new Set(membershipIds)];
    if (unique.length === 0) return [];
    const found = await this.membershipsRepo.find({
      where: { id: In(unique), organizationId },
      select: ['id'],
    });
    if (found.length !== unique.length) {
      throw new BadRequestException(
        'One or more assignees do not belong to this organization',
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
