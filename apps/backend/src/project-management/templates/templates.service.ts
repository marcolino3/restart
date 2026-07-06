import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { ProjectMember } from '@/project-management/project-members/entities/project-member.entity';
import { ProjectMemberRole } from '@/project-management/project-members/entities/project-member-role.enum';
import { Project } from '@/project-management/projects/entities/project.entity';
import { ProjectStatus } from '@/project-management/projects/entities/project-status.enum';
import { ProjectAccessService } from '@/project-management/projects/project-access.service';
import { Task } from '@/project-management/tasks/entities/task.entity';
import { TaskPriority } from '@/project-management/tasks/entities/task-priority.enum';
import { TaskStatus } from '@/project-management/tasks/entities/task-status.enum';
import { CreateProjectFromTemplateInput } from './dto/create-project-from-template.input';
import { CreateProjectTemplateInput } from './dto/create-project-template.input';
import { SaveProjectAsTemplateInput } from './dto/save-project-as-template.input';
import { UpdateProjectTemplateInput } from './dto/update-project-template.input';
import { TemplateTaskInput } from './dto/template-task.input';
import { ProjectTemplateTask } from './entities/project-template-task.entity';
import { ProjectTemplate } from './entities/project-template.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(ProjectTemplate)
    private readonly templatesRepo: Repository<ProjectTemplate>,
    @InjectRepository(ProjectTemplateTask)
    private readonly templateTasksRepo: Repository<ProjectTemplateTask>,
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
    private readonly access: ProjectAccessService,
    private readonly dataSource: DataSource,
  ) {}

  findAll(organizationId: string): Promise<ProjectTemplate[]> {
    return this.templatesRepo.find({
      where: { organizationId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<ProjectTemplate> {
    const template = await this.templatesRepo.findOne({
      where: { id, organizationId, isActive: true },
      relations: { tasks: true },
    });
    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }
    template.tasks = (template.tasks ?? []).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    return template;
  }

  async create(
    input: CreateProjectTemplateInput,
    organizationId: string,
    membershipId: string | null,
  ): Promise<ProjectTemplate> {
    return this.dataSource.transaction(async (manager) => {
      const template = await manager.getRepository(ProjectTemplate).save(
        manager.getRepository(ProjectTemplate).create({
          title: input.title.trim(),
          description: input.description ?? null,
          organizationId,
          createdByMembershipId: membershipId ?? null,
        }),
      );
      await this.writeTemplateTasks(
        manager,
        template.id,
        organizationId,
        input.tasks ?? [],
      );
      return template;
    });
  }

  async update(
    input: UpdateProjectTemplateInput,
    organizationId: string,
  ): Promise<ProjectTemplate> {
    const template = await this.loadTemplate(input.id, organizationId);

    return this.dataSource.transaction(async (manager) => {
      if (input.title !== undefined) template.title = input.title.trim();
      if (input.description !== undefined)
        template.description = input.description ?? null;
      await manager.getRepository(ProjectTemplate).save(template);

      if (input.tasks !== undefined) {
        await manager
          .getRepository(ProjectTemplateTask)
          .delete({ templateId: template.id });
        await this.writeTemplateTasks(
          manager,
          template.id,
          organizationId,
          input.tasks,
        );
      }
      return template;
    });
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const template = await this.loadTemplate(id, organizationId);
    template.isActive = false;
    await this.templatesRepo.save(template);
    return true;
  }

  /** Create a new project (with owner + tasks) from a template. */
  async instantiate(
    input: CreateProjectFromTemplateInput,
    organizationId: string,
    membershipId: string | null,
  ): Promise<Project> {
    const template = await this.findOne(input.templateId, organizationId);
    const extraIds = await this.validateMembershipsInOrg(
      input.memberMembershipIds ?? [],
      organizationId,
    );

    return this.dataSource.transaction(async (manager) => {
      const project = await manager.getRepository(Project).save(
        manager.getRepository(Project).create({
          title: (input.title ?? template.title).trim(),
          description: input.description ?? template.description ?? null,
          status: ProjectStatus.ACTIVE,
          dueDate: input.dueDate ?? null,
          organizationId,
          createdByMembershipId: membershipId ?? null,
        }),
      );

      const memberIds = new Set(extraIds);
      const members: ProjectMember[] = [];
      if (membershipId) {
        memberIds.delete(membershipId);
        members.push(
          manager.getRepository(ProjectMember).create({
            organizationId,
            projectId: project.id,
            membershipId,
            role: ProjectMemberRole.OWNER,
          }),
        );
      }
      members.push(
        ...[...memberIds].map((id) =>
          manager.getRepository(ProjectMember).create({
            organizationId,
            projectId: project.id,
            membershipId: id,
            role: ProjectMemberRole.MEMBER,
          }),
        ),
      );
      if (members.length > 0) {
        await manager.getRepository(ProjectMember).save(members);
      }

      const tasks = (template.tasks ?? []).map((tt, index) =>
        manager.getRepository(Task).create({
          title: tt.title,
          description: tt.description ?? null,
          status: TaskStatus.OPEN,
          priority: tt.priority ?? TaskPriority.MEDIUM,
          dueDate: this.resolveDueDate(input.startDate, tt.dueOffsetDays),
          sortOrder: index,
          organizationId,
          projectId: project.id,
          createdByMembershipId: membershipId ?? null,
        }),
      );
      if (tasks.length > 0) {
        await manager.getRepository(Task).save(tasks);
      }

      return project;
    });
  }

  /** Snapshot an existing project's tasks into a new template. */
  async saveProjectAsTemplate(
    input: SaveProjectAsTemplateInput,
    organizationId: string,
    membershipId: string | null,
    canSeeAll: boolean,
  ): Promise<ProjectTemplate> {
    await this.access.assertCanView(
      organizationId,
      input.projectId,
      membershipId,
      canSeeAll,
    );

    const tasks = await this.dataSource.getRepository(Task).find({
      where: { projectId: input.projectId, organizationId, isActive: true },
      order: { sortOrder: 'ASC' },
    });

    return this.dataSource.transaction(async (manager) => {
      const template = await manager.getRepository(ProjectTemplate).save(
        manager.getRepository(ProjectTemplate).create({
          title: input.title.trim(),
          description: input.description ?? null,
          organizationId,
          createdByMembershipId: membershipId ?? null,
        }),
      );
      const templateTasks = tasks.map((task, index) =>
        manager.getRepository(ProjectTemplateTask).create({
          organizationId,
          templateId: template.id,
          title: task.title,
          description: task.description ?? null,
          priority: task.priority,
          sortOrder: index,
        }),
      );
      if (templateTasks.length > 0) {
        await manager.getRepository(ProjectTemplateTask).save(templateTasks);
      }
      return template;
    });
  }

  private async loadTemplate(
    id: string,
    organizationId: string,
  ): Promise<ProjectTemplate> {
    const template = await this.templatesRepo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }
    return template;
  }

  private async writeTemplateTasks(
    manager: EntityManager,
    templateId: string,
    organizationId: string,
    tasks: TemplateTaskInput[],
  ): Promise<void> {
    if (tasks.length === 0) return;
    await manager.getRepository(ProjectTemplateTask).save(
      tasks.map((tt, index) =>
        manager.getRepository(ProjectTemplateTask).create({
          organizationId,
          templateId,
          title: tt.title.trim(),
          description: tt.description ?? null,
          priority: tt.priority ?? TaskPriority.MEDIUM,
          sortOrder: index,
          dueOffsetDays: tt.dueOffsetDays ?? null,
          defaultAssigneeRole: tt.defaultAssigneeRole ?? null,
        }),
      ),
    );
  }

  /** startDate (ISO) + offset days → ISO date string, or null. */
  private resolveDueDate(
    startDate: string | null | undefined,
    offsetDays: number | null | undefined,
  ): string | null {
    if (!startDate || offsetDays === null || offsetDays === undefined) {
      return null;
    }
    const base = new Date(`${startDate}T00:00:00Z`);
    base.setUTCDate(base.getUTCDate() + offsetDays);
    return base.toISOString().slice(0, 10);
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
