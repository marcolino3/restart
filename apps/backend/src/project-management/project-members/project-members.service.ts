import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { ProjectAccessService } from '@/project-management/projects/project-access.service';
import { AddProjectMemberInput } from './dto/add-project-member.input';
import { UpdateProjectMemberRoleInput } from './dto/update-project-member-role.input';
import { ProjectMemberRole } from './entities/project-member-role.enum';
import { ProjectMember } from './entities/project-member.entity';

@Injectable()
export class ProjectMembersService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
    private readonly access: ProjectAccessService,
  ) {}

  async findByProject(
    projectId: string,
    organizationId: string,
    actingMembershipId: string,
    canSeeAll: boolean,
  ): Promise<ProjectMember[]> {
    await this.access.assertCanView(
      organizationId,
      projectId,
      actingMembershipId,
      canSeeAll,
    );
    return this.membersRepo.find({
      where: { projectId, organizationId, isActive: true },
      relations: { membership: { user: true } },
      order: { role: 'ASC', createdAt: 'ASC' },
    });
  }

  async add(
    input: AddProjectMemberInput,
    organizationId: string,
    actingMembershipId: string,
    canSeeAll: boolean,
  ): Promise<ProjectMember> {
    await this.access.assertCanManage(
      organizationId,
      input.projectId,
      actingMembershipId,
      canSeeAll,
    );
    await this.assertMembershipInOrg(input.membershipId, organizationId);

    // Reactivate a previously removed member instead of violating the unique
    // (project, membership) constraint.
    const existing = await this.membersRepo.findOne({
      where: {
        projectId: input.projectId,
        membershipId: input.membershipId,
        organizationId,
      },
    });
    if (existing) {
      if (existing.isActive) {
        throw new BadRequestException('Membership is already a project member');
      }
      existing.isActive = true;
      existing.role = input.role ?? ProjectMemberRole.MEMBER;
      return this.membersRepo.save(existing);
    }

    const member = this.membersRepo.create({
      organizationId,
      projectId: input.projectId,
      membershipId: input.membershipId,
      role: input.role ?? ProjectMemberRole.MEMBER,
    });
    return this.membersRepo.save(member);
  }

  async updateRole(
    input: UpdateProjectMemberRoleInput,
    organizationId: string,
    actingMembershipId: string,
    canSeeAll: boolean,
  ): Promise<ProjectMember> {
    const member = await this.loadMember(input.id, organizationId);
    await this.access.assertCanManage(
      organizationId,
      member.projectId,
      actingMembershipId,
      canSeeAll,
    );

    // Don't allow demoting the final owner — every project keeps ≥1 owner.
    if (
      member.role === ProjectMemberRole.OWNER &&
      input.role !== ProjectMemberRole.OWNER
    ) {
      await this.assertNotLastOwner(member);
    }

    member.role = input.role;
    return this.membersRepo.save(member);
  }

  async remove(
    id: string,
    organizationId: string,
    actingMembershipId: string,
    canSeeAll: boolean,
  ): Promise<boolean> {
    const member = await this.loadMember(id, organizationId);
    await this.access.assertCanManage(
      organizationId,
      member.projectId,
      actingMembershipId,
      canSeeAll,
    );

    if (member.role === ProjectMemberRole.OWNER) {
      await this.assertNotLastOwner(member);
    }

    member.isActive = false;
    await this.membersRepo.save(member);
    return true;
  }

  private async loadMember(
    id: string,
    organizationId: string,
  ): Promise<ProjectMember> {
    const member = await this.membersRepo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!member) throw new NotFoundException(`Project member ${id} not found`);
    return member;
  }

  private async assertNotLastOwner(member: ProjectMember): Promise<void> {
    const otherOwners = await this.membersRepo.count({
      where: {
        projectId: member.projectId,
        organizationId: member.organizationId,
        role: ProjectMemberRole.OWNER,
        isActive: true,
        id: Not(member.id),
      },
    });
    if (otherOwners === 0) {
      throw new BadRequestException('A project must keep at least one owner');
    }
  }

  private async assertMembershipInOrg(
    membershipId: string,
    organizationId: string,
  ): Promise<void> {
    const exists = await this.membershipsRepo.findOne({
      where: { id: membershipId, organizationId },
      select: ['id'],
    });
    if (!exists) {
      throw new BadRequestException(
        'Membership does not belong to this organization',
      );
    }
  }
}
