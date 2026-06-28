import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { ProjectMember } from '@/project-management/project-members/entities/project-member.entity';
import { ProjectMemberRole } from '@/project-management/project-members/entities/project-member-role.enum';
import { ProjectAccessService } from '@/project-management/projects/project-access.service';
import { TaskAssignee } from '@/project-management/tasks/entities/task-assignee.entity';
import { TaskPriority } from '@/project-management/tasks/entities/task-priority.enum';
import { TaskStatus } from '@/project-management/tasks/entities/task-status.enum';
import { Task } from '@/project-management/tasks/entities/task.entity';
import { CreateProtocolInput } from './dto/create-protocol.input';
import { CreateTasksFromProtocolInput } from './dto/create-tasks-from-protocol.input';
import { ProtocolSectionsInput } from './dto/protocol-sections.input';
import { UpdateProtocolInput } from './dto/update-protocol.input';
import { ProtocolParticipant } from './entities/protocol-participant.entity';
import { ProtocolSections } from './entities/protocol-sections.output';
import { Protocol } from './entities/protocol.entity';

const PARTICIPANT_RELATIONS = {
  participants: { membership: { user: true } },
  project: true,
} as const;

@Injectable()
export class ProtocolsService {
  constructor(
    @InjectRepository(Protocol)
    private readonly protocolsRepo: Repository<Protocol>,
    @InjectRepository(ProtocolParticipant)
    private readonly participantsRepo: Repository<ProtocolParticipant>,
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
    private readonly access: ProjectAccessService,
    private readonly dataSource: DataSource,
  ) {}

  findAll(organizationId: string): Promise<Protocol[]> {
    return this.protocolsRepo.find({
      where: { organizationId, isActive: true },
      relations: { project: true },
      order: { meetingDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Protocol> {
    const protocol = await this.protocolsRepo.findOne({
      where: { id, organizationId, isActive: true },
      relations: PARTICIPANT_RELATIONS,
    });
    if (!protocol) throw new NotFoundException(`Protocol ${id} not found`);
    return protocol;
  }

  async create(
    input: CreateProtocolInput,
    organizationId: string,
    membershipId: string | null,
    canSeeAll: boolean,
  ): Promise<Protocol> {
    if (input.projectId) {
      await this.access.assertCanView(
        organizationId,
        input.projectId,
        membershipId,
        canSeeAll,
      );
    }
    const participantIds = await this.validateMembershipsInOrg(
      input.participantMembershipIds ?? [],
      organizationId,
    );

    return this.dataSource.transaction(async (manager) => {
      const protocol = await manager.getRepository(Protocol).save(
        manager.getRepository(Protocol).create({
          title: input.title.trim(),
          meetingDate: input.meetingDate ?? null,
          status: input.status,
          organizationId,
          projectId: input.projectId ?? null,
          createdByMembershipId: membershipId ?? null,
          externalParticipants: input.externalParticipants ?? [],
          sections: mergeSections(input.sections),
        }),
      );
      await this.writeParticipants(
        manager,
        protocol.id,
        organizationId,
        participantIds,
      );
      return protocol;
    });
  }

  async update(
    input: UpdateProtocolInput,
    organizationId: string,
    membershipId: string | null,
    canSeeAll: boolean,
    canManageAll: boolean,
  ): Promise<Protocol> {
    const protocol = await this.loadProtocol(input.id, organizationId);
    await this.assertCanEdit(protocol, membershipId, canManageAll);

    if (input.projectId) {
      await this.access.assertCanView(
        organizationId,
        input.projectId,
        membershipId,
        canSeeAll,
      );
    }
    const participantIds =
      input.participantMembershipIds !== undefined
        ? await this.validateMembershipsInOrg(
            input.participantMembershipIds,
            organizationId,
          )
        : undefined;

    return this.dataSource.transaction(async (manager) => {
      if (input.title !== undefined) protocol.title = input.title.trim();
      if (input.meetingDate !== undefined)
        protocol.meetingDate = input.meetingDate ?? null;
      if (input.status !== undefined) protocol.status = input.status;
      if (input.projectId !== undefined)
        protocol.projectId = input.projectId ?? null;
      if (input.externalParticipants !== undefined)
        protocol.externalParticipants = input.externalParticipants;
      if (input.sections !== undefined)
        protocol.sections = mergeSections(input.sections);
      await manager.getRepository(Protocol).save(protocol);

      if (participantIds !== undefined) {
        await manager
          .getRepository(ProtocolParticipant)
          .delete({ protocolId: protocol.id });
        await this.writeParticipants(
          manager,
          protocol.id,
          organizationId,
          participantIds,
        );
      }
      return protocol;
    });
  }

  async remove(
    id: string,
    organizationId: string,
    membershipId: string | null,
    canManageAll: boolean,
  ): Promise<boolean> {
    const protocol = await this.loadProtocol(id, organizationId);
    // Deletion is stricter than editing: only the creator or an admin.
    if (
      !canManageAll &&
      !(membershipId && protocol.createdByMembershipId === membershipId)
    ) {
      throw new ForbiddenException(
        'Only the creator or an admin can delete this protocol',
      );
    }
    protocol.isActive = false;
    await this.protocolsRepo.save(protocol);
    return true;
  }

  /**
   * Turn a protocol's "Todos/Massnahmen" into real Tasks. Each task keeps a
   * `protocolId` back-reference and is assigned to its "Verantwortlich" — so it
   * always shows up in those people's "My Tasks". If the protocol is linked to
   * a project, the tasks also land on that board; assignees who aren't yet
   * project members are added as MEMBER so the board invariant holds.
   */
  async createTasksFromProtocol(
    input: CreateTasksFromProtocolInput,
    organizationId: string,
    membershipId: string | null,
    canManageAll: boolean,
  ): Promise<Task[]> {
    const protocol = await this.loadProtocol(input.protocolId, organizationId);
    await this.assertCanEdit(protocol, membershipId, canManageAll);
    const projectId = protocol.projectId ?? null;

    // Validate every assignee belongs to the org (across all drafts).
    const allAssignees = [
      ...new Set(input.tasks.flatMap((d) => d.assigneeMembershipIds ?? [])),
    ];
    await this.validateMembershipsInOrg(allAssignees, organizationId);

    return this.dataSource.transaction(async (manager) => {
      if (projectId) {
        await this.ensureProjectMembers(
          manager,
          projectId,
          organizationId,
          allAssignees,
        );
      }

      const created: Task[] = [];
      let order = projectId ? await this.maxSortOrder(manager, projectId) : 0;

      for (const draft of input.tasks) {
        const task = await manager.getRepository(Task).save(
          manager.getRepository(Task).create({
            title: draft.title.trim(),
            description: draft.description ?? null,
            status: TaskStatus.OPEN,
            priority: draft.priority ?? TaskPriority.MEDIUM,
            dueDate: draft.dueDate ?? null,
            sortOrder: projectId ? ++order : 0,
            organizationId,
            projectId,
            protocolId: protocol.id,
            createdByMembershipId: protocol.createdByMembershipId ?? null,
          }),
        );
        const assigneeIds = [...new Set(draft.assigneeMembershipIds ?? [])];
        if (assigneeIds.length > 0) {
          await manager.getRepository(TaskAssignee).save(
            assigneeIds.map((membershipId) =>
              manager.getRepository(TaskAssignee).create({
                organizationId,
                taskId: task.id,
                membershipId,
              }),
            ),
          );
        }
        created.push(task);
      }
      return created;
    });
  }

  private async loadProtocol(
    id: string,
    organizationId: string,
  ): Promise<Protocol> {
    const protocol = await this.protocolsRepo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!protocol) throw new NotFoundException(`Protocol ${id} not found`);
    return protocol;
  }

  /**
   * Editing a protocol (and turning its todos into tasks) is limited to people
   * who were involved: the creator or a meeting participant. Admins
   * (canManageAll) may edit any. Everyone else has read-only access.
   */
  private async assertCanEdit(
    protocol: Protocol,
    membershipId: string | null,
    canManageAll: boolean,
  ): Promise<void> {
    if (canManageAll) return;
    if (membershipId && protocol.createdByMembershipId === membershipId) return;
    if (membershipId) {
      const participant = await this.participantsRepo.findOne({
        where: { protocolId: protocol.id, membershipId, isActive: true },
        select: ['id'],
      });
      if (participant) return;
    }
    throw new ForbiddenException(
      'Only meeting participants can edit this protocol',
    );
  }

  private async writeParticipants(
    manager: EntityManager,
    protocolId: string,
    organizationId: string,
    membershipIds: string[],
  ): Promise<void> {
    if (membershipIds.length === 0) return;
    await manager.getRepository(ProtocolParticipant).save(
      membershipIds.map((membershipId) =>
        manager.getRepository(ProtocolParticipant).create({
          organizationId,
          protocolId,
          membershipId,
        }),
      ),
    );
  }

  /** Add any assignees that are not yet active members of the project. */
  private async ensureProjectMembers(
    manager: EntityManager,
    projectId: string,
    organizationId: string,
    membershipIds: string[],
  ): Promise<void> {
    if (membershipIds.length === 0) return;
    const existing = await manager.getRepository(ProjectMember).find({
      where: { projectId, organizationId, membershipId: In(membershipIds) },
    });
    const byId = new Map(existing.map((m) => [m.membershipId, m]));
    const toSave: ProjectMember[] = [];
    for (const membershipId of membershipIds) {
      const found = byId.get(membershipId);
      if (!found) {
        toSave.push(
          manager.getRepository(ProjectMember).create({
            organizationId,
            projectId,
            membershipId,
            role: ProjectMemberRole.MEMBER,
          }),
        );
      } else if (!found.isActive) {
        found.isActive = true;
        toSave.push(found);
      }
    }
    if (toSave.length > 0) {
      await manager.getRepository(ProjectMember).save(toSave);
    }
  }

  private async maxSortOrder(
    manager: EntityManager,
    projectId: string,
  ): Promise<number> {
    const row = await manager
      .getRepository(Task)
      .createQueryBuilder('task')
      .select('COALESCE(MAX(task.sort_order), -1)', 'max')
      .where('task.project_id = :projectId', { projectId })
      .andWhere('task."isActive" = true')
      .getRawOne<{ max: number }>();
    return Number(row?.max ?? -1);
  }

  private async validateMembershipsInOrg(
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
        'One or more memberships do not belong to this organization',
      );
    }
    return unique;
  }
}

/** Fill any missing section arrays so the stored shape is always complete. */
function mergeSections(input?: ProtocolSectionsInput | null): ProtocolSections {
  return {
    agendaItems: input?.agendaItems ?? [],
    decisions: input?.decisions ?? [],
    communications: input?.communications ?? [],
    infoPoints: input?.infoPoints ?? [],
    challenges: input?.challenges ?? [],
    openPoints: (input?.openPoints ?? []).map((p) => ({
      topic: p.topic,
      nextStep: p.nextStep ?? null,
      forNextMeeting: p.forNextMeeting ?? false,
    })),
  };
}
