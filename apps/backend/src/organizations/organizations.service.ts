// src/organizations/organizations.service.ts
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Organization } from '@/organizations/entities/organization.entity';
import { UpdateOrganizationInput } from './dto/update-organization.input';

import { Membership } from '@/memberships/entities/membership.entity';
import { SystemRole } from '@/roles/entities/system-role.enum';

import { seedOrgSystemRoles } from '@/roles/seeds/system-roles.seeder';
import { assignPermissionsToOrgSystemRoles } from '@/roles/seeds/assign-permissions-to-system-roles.seeder';

import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { seedOrgEmployeeAbsenceCategories } from '@/employee-management/employee-absence-categories/seeds/seed-org-employee-absence-categories.seeder';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly entityManager: EntityManager,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  /**
   * Legt eine leere Organisation an + Seeds (Rollen, Permissions, AbsenceCategories).
   */
  async create() {
    return this.entityManager.transaction(async (manager) => {
      const org = await manager.save(
        manager.create(Organization, {
          isActive: false,
          timezone: 'Europe/Berlin',
        }),
      );

      await seedOrgEmployeeAbsenceCategories(manager, org.id);
      await seedOrgSystemRoles(manager, org.id);
      await assignPermissionsToOrgSystemRoles(manager, org.id);

      return org;
    });
  }

  /**
   * Alle Orgs fuer den aktuellen User:
   * - Superadmin: alle
   * - sonst: nur Orgs, in denen der User Memberships hat
   */
  async findAllForUser(user: TokenPayload) {
    if (user.isSuperAdmin) {
      return this.orgRepo.find();
    }

    // Orgs ueber Memberships des Users
    const orgs = await this.entityManager
      .getRepository(Organization)
      .createQueryBuilder('o')
      .innerJoin(
        Membership,
        'm',
        'm.organization_id = o.id AND m.user_id = :uid',
        {
          uid: user.sub,
        },
      )
      .getMany();

    return orgs;
  }

  /**
   * Eine Org holen, nur wenn der User Zugriff hat
   */
  async findOneForUser(orgId: string, user: TokenPayload) {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    if (user.isSuperAdmin) return org;

    const hasMembership = await this.entityManager.exists(Membership, {
      where: { organizationId: orgId, userId: user.sub },
    });
    if (!hasMembership)
      throw new ForbiddenException('No access to this organization');
    return org;
  }

  /**
   * Nach Slug (ohne Zugriffspruefung, z. B. beim Login/Callback)
   */
  async findBySlug(slug: string): Promise<Organization> {
    const norm = slug.trim().toLowerCase();
    const org = await this.orgRepo.findOne({ where: { slug: norm } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  /**
   * Pruefen ob ein Slug verfuegbar ist.
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    const norm = slug.trim().toLowerCase();
    if (!norm) return false;
    const exists = await this.orgRepo.exist({ where: { slug: norm } });
    return !exists;
  }

  /**
   * Org updaten (org-gebunden). Optional Slug-Aenderung mit Unique-Check.
   */
  async updateForActiveOrg(
    orgId: string,
    input: UpdateOrganizationInput,
    user: TokenPayload,
  ) {
    // Zugriff
    if (!user.isSuperAdmin) {
      const isAdmin = await this.userHasRoleInOrg(user.sub, orgId, [
        SystemRole.ORG_OWNER,
        SystemRole.ORG_ADMIN,
      ]);
      if (!isAdmin) throw new ForbiddenException('Insufficient role');
    }

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    // optional Slug-Aenderung
    if (input.slug && input.slug !== org.slug) {
      const nextSlug = input.slug.trim().toLowerCase();
      const exists = await this.orgRepo.exist({ where: { slug: nextSlug } });
      if (exists)
        throw new ConflictException('Organization slug already exists');
      org.slug = nextSlug;
    }

    if (typeof input.name === 'string') {
      org.name = input.name;
    }

    if (input.domain !== undefined) org.domain = input.domain || undefined;
    if (input.street !== undefined) org.street = input.street || undefined;
    if (input.zip !== undefined) org.zip = input.zip || undefined;
    if (input.city !== undefined) org.city = input.city || undefined;
    if (input.country !== undefined) org.country = input.country || undefined;
    if (input.phone !== undefined) org.phone = input.phone || undefined;
    if (input.email !== undefined) org.email = input.email || undefined;
    if (input.website !== undefined) org.website = input.website || undefined;
    if (input.timezone !== undefined) org.timezone = input.timezone;

    return this.orgRepo.save(org);
  }

  /**
   * Org entfernen (org-gebunden). Standard: Soft Delete (falls Base das unterstuetzt),
   * oder isActive=false setzen.
   */
  async removeForActiveOrg(orgId: string, user: TokenPayload) {
    if (!user.isSuperAdmin) {
      const isOwner = await this.userHasRoleInOrg(user.sub, orgId, [
        SystemRole.ORG_OWNER,
      ]);
      if (!isOwner)
        throw new ForbiddenException('Only owner can delete organization');
    }

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    // Soft-Delete wenn AbstractEntity deletedAt hat und Repo konfiguriert ist:
    // return this.orgRepo.softRemove(org);

    // Fallback: deaktivieren
    if ('isActive' in org) {
      org.isActive = false;
      return this.orgRepo.save(org);
    }

    // Letzter Ausweg (DEV): hart loeschen
    return this.orgRepo.remove(org);
  }

  /**
   * Hilfsfunktion: hat User eine der Rollen in dieser Org?
   */
  private async userHasRoleInOrg(
    userId: string,
    orgId: string,
    roles: SystemRole[],
  ) {
    // membership + roles laden
    const membership = await this.entityManager
      .getRepository(Membership)
      .findOne({
        where: { userId, organizationId: orgId },
        relations: ['roles'],
      });
    if (!membership) return false;
    const codes = membership.roles?.map((r) => r.systemCode ?? r.name) ?? [];
    return roles.some((r) => codes.includes(r));
  }
}
