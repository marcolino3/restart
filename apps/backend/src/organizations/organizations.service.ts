// src/organizations/organizations.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';

import { Organization } from '@/organizations/entities/organization.entity';
import { CreateOrganizationInput } from './dto/create-organization.input';
import { UpdateOrganizationInput } from './dto/update-organization.input';

import { User } from '@/users/entities/user.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Role } from '@/roles/entities/role.entity';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { Persona } from '@/common/enums/persona.enum';

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
   * Legt eine neue Organisation an, seeden der Systemrollen & Permissions,
   * Owner-User (find-or-create), Membership, Owner-Rolle zuweisen.
   */
  async create(input: CreateOrganizationInput) {
    return this.entityManager
      .transaction(async (manager) => {
        const {
          organizationName,
          organizationSlug,
          ownerFirstName,
          ownerLastName,
          ownerEmail,
          ownerPassword,
        } = input;

        // 0) Normalisieren
        const slug = organizationSlug.trim().toLowerCase();
        const email = ownerEmail.trim().toLowerCase();

        if (!slug) throw new BadRequestException('Slug required');

        // 1) Slug-Check (Unique rettet Race-Condition)
        const exists = await manager.exists(Organization, { where: { slug } });
        if (exists)
          throw new ConflictException('Organization slug already exists');

        // 2) Organization
        const organizationSaved = await manager.save(
          manager.create(Organization, { name: organizationName, slug }),
        );

        // 3) User find-or-create (bestehenden User NICHT mit neuem PW ueberschreiben)
        let user = await manager.findOneBy(User, { email });
        if (!user) {
          const passwordHash = await hash(
            ownerPassword,
            Number(process.env.BCRYPT_ROUNDS ?? 10),
          );
          user = await manager.save(
            manager.create(User, {
              firstName: ownerFirstName,
              lastName: ownerLastName,
              email,
              passwordHash,
            }),
          );
        }

        // 4) Seeds fuer diese Org
        await seedOrgEmployeeAbsenceCategories(manager, organizationSaved.id);
        await seedOrgSystemRoles(manager, organizationSaved.id);
        await assignPermissionsToOrgSystemRoles(manager, organizationSaved.id);

        // 5) Membership anlegen
        const membershipSaved = await manager.save(
          manager.create(Membership, {
            organizationId: organizationSaved.id,
            userId: user.id,
            persona: Persona.ADMIN,
          }),
        );

        // 6) ORG_OWNER zuweisen
        const ownerRole = await manager.getRepository(Role).findOneByOrFail({
          organizationId: organizationSaved.id,
          systemCode: SystemRole.ORG_OWNER,
        });

        await manager
          .createQueryBuilder()
          .relation(Membership, 'roles')
          .of(membershipSaved.id)
          .add(ownerRole.id);

        return {
          organizationId: organizationSaved.id,
          userId: user.id,
          membershipId: membershipSaved.id,
        };
      })
      .catch((error) => {
        // Postgres Unique
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error?.code === '23505') {
          throw new ConflictException('Unique constraint violated');
        }
        throw error;
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
