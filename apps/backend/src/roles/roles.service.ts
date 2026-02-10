import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { PermissionsService } from '@/permissions/permissions.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private readonly permissionsService: PermissionsService,
  ) {}

  async findAllByOrgId(orgId: string): Promise<Role[]> {
    return this.roleRepo.find({
      where: { organizationId: orgId },
      relations: ['permissions'],
      order: { isSystem: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: string, orgId: string): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id, organizationId: orgId },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async updateRolePermissions(
    roleId: string,
    permissionCodes: string[],
    orgId: string,
  ): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id: roleId, organizationId: orgId },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException(`Role ${roleId} not found in org`);

    const permissions =
      await this.permissionsService.findByCodes(permissionCodes);
    role.permissions = permissions;
    return this.roleRepo.save(role);
  }
}
