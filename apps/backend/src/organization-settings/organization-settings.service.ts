import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { OrganizationSetting } from './entities/organization-setting.entity';
import { CreateOrganizationSettingInput } from './dto/create-organization-setting.input';
import { UpdateOrganizationSettingInput } from './dto/update-organization-setting.input';
import { OrganizationSettingOutput } from './dto/organization-setting.output';
import { EncryptionService } from './encryption.service';

import { Membership } from '@/memberships/entities/membership.entity';
import { SystemRole } from '@/roles/entities/system-role.enum';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

@Injectable()
export class OrganizationSettingsService {
  constructor(
    private readonly entityManager: EntityManager,
    @InjectRepository(OrganizationSetting)
    private readonly settingRepo: Repository<OrganizationSetting>,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Create a new organization setting with encrypted value
   */
  async create(
    input: CreateOrganizationSettingInput,
    user: TokenPayload,
  ): Promise<OrganizationSettingOutput> {
    await this.checkOrgAccess(input.organizationId, user);

    const key = input.key.trim().toUpperCase();

    // Check for duplicate key
    const exists = await this.settingRepo.exist({
      where: { organizationId: input.organizationId, key },
    });
    if (exists) {
      throw new ConflictException(`Setting with key "${key}" already exists`);
    }

    // Encrypt the value
    const encrypted = this.encryptionService.encrypt(input.value);

    const setting = await this.settingRepo.save(
      this.settingRepo.create({
        organizationId: input.organizationId,
        key,
        encryptedValue: encrypted.encryptedValue,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        description: input.description,
      }),
    );

    return this.toOutput(setting, false);
  }

  /**
   * Get all settings for an organization (without decrypted values)
   */
  async findAllForOrg(
    organizationId: string,
    user: TokenPayload,
  ): Promise<OrganizationSettingOutput[]> {
    await this.checkOrgAccess(organizationId, user);

    const settings = await this.settingRepo.find({
      where: { organizationId, isActive: true },
      order: { key: 'ASC' },
    });

    return settings.map((s) => this.toOutput(s, false));
  }

  /**
   * Get a single setting with decrypted value
   */
  async findOne(
    organizationId: string,
    key: string,
    user: TokenPayload,
    decrypt: boolean = false,
  ): Promise<OrganizationSettingOutput> {
    await this.checkOrgAccess(organizationId, user);

    const normalizedKey = key.trim().toUpperCase();
    const setting = await this.settingRepo.findOne({
      where: { organizationId, key: normalizedKey, isActive: true },
    });

    if (!setting) {
      throw new NotFoundException(`Setting "${normalizedKey}" not found`);
    }

    return this.toOutput(setting, decrypt);
  }

  /**
   * Update an existing setting
   */
  async update(
    input: UpdateOrganizationSettingInput,
    user: TokenPayload,
  ): Promise<OrganizationSettingOutput> {
    await this.checkOrgAccess(input.organizationId, user);

    const normalizedKey = input.key.trim().toUpperCase();
    const setting = await this.settingRepo.findOne({
      where: { organizationId: input.organizationId, key: normalizedKey, isActive: true },
    });

    if (!setting) {
      throw new NotFoundException(`Setting "${normalizedKey}" not found`);
    }

    // Update value if provided
    if (input.value !== undefined) {
      const encrypted = this.encryptionService.encrypt(input.value);
      setting.encryptedValue = encrypted.encryptedValue;
      setting.iv = encrypted.iv;
      setting.authTag = encrypted.authTag;
    }

    // Update description if provided
    if (input.description !== undefined) {
      setting.description = input.description;
    }

    const updated = await this.settingRepo.save(setting);
    return this.toOutput(updated, false);
  }

  /**
   * Delete a setting
   */
  async remove(
    organizationId: string,
    key: string,
    user: TokenPayload,
  ): Promise<boolean> {
    await this.checkOrgAccess(organizationId, user);

    const normalizedKey = key.trim().toUpperCase();
    const setting = await this.settingRepo.findOne({
      where: { organizationId, key: normalizedKey, isActive: true },
    });

    if (!setting) {
      throw new NotFoundException(`Setting "${normalizedKey}" not found`);
    }

    // Soft delete
    setting.isActive = false;
    setting.deletedAt = new Date();
    await this.settingRepo.save(setting);

    return true;
  }

  /**
   * Get decrypted value for internal use (e.g., other services)
   */
  async getDecryptedValue(organizationId: string, key: string): Promise<string | null> {
    const normalizedKey = key.trim().toUpperCase();
    const setting = await this.settingRepo.findOne({
      where: { organizationId, key: normalizedKey, isActive: true },
    });

    if (!setting) {
      return null;
    }

    return this.encryptionService.decrypt(
      setting.encryptedValue,
      setting.iv,
      setting.authTag,
    );
  }

  /**
   * Check if user has access to organization settings
   */
  private async checkOrgAccess(organizationId: string, user: TokenPayload): Promise<void> {
    if (user.isSuperAdmin) {
      return;
    }

    // Check if user has ORG_OWNER or ORG_ADMIN role in this org
    const membership = await this.entityManager
      .getRepository(Membership)
      .findOne({
        where: { userId: user.sub, organizationId },
        relations: ['roles'],
      });

    if (!membership) {
      throw new ForbiddenException('No access to this organization');
    }

    const allowedRoles = [SystemRole.ORG_OWNER, SystemRole.ORG_ADMIN];
    const hasRole = membership.roles?.some(
      (r) => r.systemCode && allowedRoles.includes(r.systemCode as SystemRole),
    );

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions to manage settings');
    }
  }

  /**
   * Convert entity to output DTO
   */
  private toOutput(
    setting: OrganizationSetting,
    includeValue: boolean,
  ): OrganizationSettingOutput {
    const output: OrganizationSettingOutput = {
      id: setting.id,
      organizationId: setting.organizationId,
      key: setting.key,
      description: setting.description,
      hasValue: !!setting.encryptedValue,
      version: setting.version,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };

    if (includeValue && setting.encryptedValue) {
      output.value = this.encryptionService.decrypt(
        setting.encryptedValue,
        setting.iv,
        setting.authTag,
      );
    }

    return output;
  }
}
