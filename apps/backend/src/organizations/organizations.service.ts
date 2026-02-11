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
import { GeocodingService } from '@/google/geocoding.service';

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
    private readonly geocodingService: GeocodingService,
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
      return this.orgRepo.find({ where: { isArchived: false } });
    }

    return this.entityManager
      .getRepository(Organization)
      .createQueryBuilder('o')
      .innerJoin(
        Membership,
        'm',
        'm.organization_id = o.id AND m.user_id = :uid',
        { uid: user.sub },
      )
      .where('o.is_archived = :archived', { archived: false })
      .getMany();
  }

  /**
   * Eine Org holen, nur wenn der User Zugriff hat.
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
   * Nach Subdomain (ohne Zugriffspruefung, z. B. beim Login/Callback).
   */
  async findBySubdomain(subdomain: string): Promise<Organization> {
    const norm = subdomain.trim().toLowerCase();
    const org = await this.orgRepo.findOne({ where: { subdomain: norm } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async isSubdomainAvailable(subdomain: string): Promise<boolean> {
    const norm = subdomain.trim().toLowerCase();
    if (!norm) return false;
    return !(await this.orgRepo.exists({ where: { subdomain: norm } }));
  }

  async isDomainAvailable(domain: string): Promise<boolean> {
    const norm = domain.trim().toLowerCase();
    if (!norm) return false;
    return !(await this.orgRepo.exists({ where: { domain: norm } }));
  }

  /**
   * Org updaten. Subdomain + Domain mit Unique-Check.
   */
  async updateOrganization(orgId: string, input: UpdateOrganizationInput) {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const { id: _id, subdomain, domain, ...rest } = input;

    if (subdomain && subdomain !== org.subdomain) {
      const next = subdomain.trim().toLowerCase();
      if (await this.orgRepo.exists({ where: { subdomain: next } }))
        throw new ConflictException('Organization subdomain already exists');
      org.subdomain = next;
    }

    if (domain && domain !== org.domain) {
      if (await this.orgRepo.exists({ where: { domain } }))
        throw new ConflictException('Organization domain already exists');
      org.domain = domain;
    }

    Object.assign(org, rest);

    // Geocode if any address field changed
    const addressChanged =
      'street' in input ||
      'zip' in input ||
      'city' in input ||
      'country' in input;

    if (addressChanged) {
      try {
        const result = await this.geocodingService.geocode({
          street: org.street,
          zip: org.zip,
          city: org.city,
          country: org.country,
        });

        if (result) {
          org.latitude = result.latitude;
          org.longitude = result.longitude;
          org.location = `(${result.longitude},${result.latitude})`;
        }
      } catch {
        // Geocoding failure should not block saving
      }
    }

    return this.orgRepo.save(org);
  }

  /**
   * Org entfernen (Soft Delete: isActive=false).
   */
  async removeOrganization(orgId: string) {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    org.isActive = false;
    org.isArchived = true;
    return this.orgRepo.save(org);
  }
}
