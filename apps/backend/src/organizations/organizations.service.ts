// src/organizations/organizations.service.ts
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';

import { Organization } from '@/organizations/entities/organization.entity';
import { UpdateOrganizationInput } from './dto/update-organization.input';
import { CreateOrganizationInput } from './dto/create-organization.input';
import { ChangeOrganizationPlanInput } from './dto/change-organization-plan.input';
import {
  OrganizationOverviewRow,
  OrganizationsOverview,
} from './dto/organizations-overview.output';
import { OrganizationUsage } from './dto/organization-usage.output';
import { ExportOrganizationDataResult } from './dto/export-organization-data.output';
import { Membership } from '@/memberships/entities/membership.entity';
import { Role } from '@/roles/entities/role.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { GeocodingService } from '@/google/geocoding.service';
import { OrganizationAuditLogService } from './organization-audit-log.service';

import { seedOrgSystemRoles } from '@/roles/seeds/system-roles.seeder';
import { assignPermissionsToOrgSystemRoles } from '@/roles/seeds/assign-permissions-to-system-roles.seeder';

import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { seedOrgEmployeeAbsenceCategories } from '@/employee-management/employee-absence-categories/seeds/seed-org-employee-absence-categories.seeder';
import { seedOrgEmployeeFunctions } from '@/employee-management/employee-functions/seeds/seed-org-employee-functions.seeder';
import { seedOrgAdmissionStages } from '@/school-management/admission-stages/seeds/default-admission-stages';
import { seedOrgAdmissionSources } from '@/school-management/admission-sources/seeds/default-admission-sources';
import { seedOrgFeatureToggles } from '@/organizations/seeds/seed-org-feature-toggles.seeder';
import { OrganizationAuditAction } from '@restart/shared-schemas/organizations/organization-enums';
import { Persona } from '@/common/enums/persona.enum';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import { User } from '@/users/entities/user.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly entityManager: EntityManager,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    private readonly geocodingService: GeocodingService,
    private readonly auditLogService: OrganizationAuditLogService,
  ) {}

  /**
   * Legt eine Organisation inkl. Owner (User + Membership + ORG_OWNER-Rolle)
   * an, in einer einzigen Transaktion. Bricht eine der Seed-Funktionen ab,
   * wird der komplette Vorgang zurueckgerollt.
   */
  async create(input: CreateOrganizationInput) {
    return this.entityManager.transaction(async (manager) => {
      const org = await manager.save(
        manager.create(Organization, {
          name: input.organizationName,
          subdomain: input.organizationSubdomain?.trim().toLowerCase(),
          street: input.street,
          zip: input.zip,
          city: input.city,
          country: input.country,
          phone: input.phone,
          email: input.email,
          website: input.website,
          timezone: input.timezone ?? 'Europe/Berlin',
          isActive: true,
        }),
      );

      await seedOrgEmployeeAbsenceCategories(manager, org.id);
      await seedOrgEmployeeFunctions(manager, org.id);
      await seedOrgSystemRoles(manager, org.id);
      await assignPermissionsToOrgSystemRoles(manager, org.id);
      await seedOrgAdmissionStages(manager, org.id);
      await seedOrgAdmissionSources(manager, org.id);
      await seedOrgFeatureToggles(manager, org.id);

      if (input.ownerEmail) {
        const user = await manager.save(
          manager.create(User, {
            firstName: input.ownerFirstName ?? '',
            lastName: input.ownerLastName ?? '',
            isActive: true,
          }),
        );

        const passwordHash = input.ownerPassword
          ? await hash(
              input.ownerPassword,
              Number(process.env.BCRYPT_ROUNDS ?? 10),
            )
          : undefined;

        const norm = input.ownerEmail.trim().toLowerCase();
        const userEmail = await manager.save(
          manager.create(UserEmail, {
            userId: user.id,
            email: norm,
            passwordHash,
            isPrimary: true,
            isVerified: true,
          }),
        );

        const ownerRole = await manager.findOne(Role, {
          where: { organizationId: org.id, systemCode: SystemRole.ORG_OWNER },
        });

        const membership = manager.create(Membership, {
          userId: user.id,
          organizationId: org.id,
          persona: Persona.ADMIN,
          userEmailId: userEmail.id,
          roles: ownerRole ? [ownerRole] : [],
        });
        await manager.save(membership);
      }

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
      .where('o."isArchived" = :archived', { archived: false })
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
      const next = domain.trim().toLowerCase();
      if (await this.orgRepo.exists({ where: { domain: next } }))
        throw new ConflictException('Organization domain already exists');
      org.domain = next;
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

  /**
   * SuperAdmin-Liste aller Orgs + 4 Kennzahlen + pro Zeile memberCount /
   * childCount / enabledFeatureCount / trialDaysRemaining. Eine QueryBuilder-
   * Query mit LEFT JOIN + COUNT (kein N+1).
   */
  async getOrganizationsOverview(): Promise<OrganizationsOverview> {
    const rawRows = await this.orgRepo
      .createQueryBuilder('o')
      .leftJoin(Membership, 'm', 'm.organization_id = o.id')
      .leftJoin(
        Student,
        's',
        's.organization_id = o.id AND s."isArchived" = false',
      )
      .leftJoin(
        'organization_feature_toggles',
        'ft',
        'ft.organization_id = o.id AND ft.enabled = true',
      )
      .where('o."isArchived" = false')
      .select('o.id', 'orgId')
      .addSelect('COUNT(DISTINCT m.id)', 'memberCount')
      .addSelect('COUNT(DISTINCT s.id)', 'childCount')
      .addSelect('COUNT(DISTINCT ft.id)', 'enabledFeatureCount')
      .groupBy('o.id')
      .getRawMany<{
        orgId: string;
        memberCount: string;
        childCount: string;
        enabledFeatureCount: string;
      }>();

    const orgs = await this.orgRepo.find({ where: { isArchived: false } });
    const countsByOrgId = new Map(rawRows.map((r) => [r.orgId, r]));

    const now = Date.now();
    const rows: OrganizationOverviewRow[] = orgs.map((organization) => {
      const counts = countsByOrgId.get(organization.id);
      let trialDaysRemaining: number | undefined;
      if (
        organization.lifecycleStatus === 'TRIAL' &&
        organization.trialEndsAt
      ) {
        const diffMs = new Date(organization.trialEndsAt).getTime() - now;
        trialDaysRemaining = Math.max(
          0,
          Math.ceil(diffMs / (1000 * 60 * 60 * 24)),
        );
      }

      return {
        organization,
        memberCount: Number(counts?.memberCount ?? 0),
        childCount: Number(counts?.childCount ?? 0),
        enabledFeatureCount: Number(counts?.enabledFeatureCount ?? 0),
        trialDaysRemaining,
      };
    });

    const stats: OrganizationsOverview['stats'] = {
      activeCount: orgs.filter((o) => o.lifecycleStatus === 'ACTIVE').length,
      trialCount: orgs.filter((o) => o.lifecycleStatus === 'TRIAL').length,
      suspendedCount: orgs.filter((o) => o.lifecycleStatus === 'SUSPENDED')
        .length,
      totalUserCount: rows.reduce((sum, r) => sum + r.memberCount, 0),
    };

    return { stats, rows };
  }

  /**
   * Nutzungs-Kennzahlen fuer eine Org. Login-Tracking existiert nicht als
   * eigene Domain-Entity — better-auth verwaltet seine eigene "session"-
   * Tabelle (raw SQL, wie in UsersService.changeUserEmail), verknuepft ueber
   * die Login-Email in user_emails. "Aktive Nutzer 30 Tage" / "letzter
   * Login" / "Logins pro Tag" werden daraus abgeleitet.
   */
  async getOrganizationUsage(
    organizationId: string,
  ): Promise<OrganizationUsage> {
    const org = await this.orgRepo.findOne({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found');

    const [{ count: userCount }] = await this.entityManager.query(
      `SELECT COUNT(*)::int AS count FROM memberships WHERE organization_id = $1`,
      [organizationId],
    );
    const [{ count: childCount }] = await this.entityManager.query(
      `SELECT COUNT(*)::int AS count FROM students WHERE organization_id = $1 AND "isArchived" = false`,
      [organizationId],
    );

    const sessionRows: Array<{
      active_users_30d: string;
      last_login_at: Date | null;
      logins_30d: string;
    }> = await this.entityManager.query(
      `
      SELECT
        COUNT(DISTINCT s."userId")::int AS active_users_30d,
        MAX(s."createdAt") AS last_login_at,
        COUNT(*)::int AS logins_30d
      FROM session s
      INNER JOIN "user" au ON au.id = s."userId"
      INNER JOIN user_emails ue ON LOWER(ue.email) = LOWER(au.email)
      INNER JOIN memberships mem ON mem.user_email_id = ue.id
      WHERE mem.organization_id = $1
        AND s."createdAt" >= NOW() - INTERVAL '30 days'
      `,
      [organizationId],
    );

    const activeUsersLast30Days = Number(sessionRows[0]?.active_users_30d ?? 0);
    const lastLoginAt = sessionRows[0]?.last_login_at ?? undefined;
    const logins30d = Number(sessionRows[0]?.logins_30d ?? 0);

    return {
      userCount: Number(userCount),
      childCount: Number(childCount),
      storageUsedGb: 0,
      activeUsersLast30Days,
      lastLoginAt,
      avgLoginsPerDay: logins30d / 30,
    };
  }

  /**
   * Sperrt eine Org (SuperAdmin): lifecycleStatus=SUSPENDED, isActive=false,
   * Audit-Log-Eintrag.
   */
  async suspendOrganization(
    id: string,
    reason: string | undefined,
    actorUserId: string,
  ): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    org.lifecycleStatus = 'SUSPENDED';
    org.isActive = false;
    org.suspendedAt = new Date();
    org.suspendedReason = reason;
    org.suspendedById = actorUserId;
    const saved = await this.orgRepo.save(org);

    await this.auditLogService.record(
      id,
      OrganizationAuditAction.SUSPENDED,
      actorUserId,
      { reason },
    );

    return saved;
  }

  /**
   * Entsperrt eine Org (SuperAdmin): lifecycleStatus=ACTIVE, isActive=true,
   * loescht die Suspend-Felder, Audit-Log-Eintrag.
   */
  async reactivateOrganization(
    id: string,
    actorUserId: string,
  ): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    org.lifecycleStatus = 'ACTIVE';
    org.isActive = true;
    org.suspendedAt = undefined;
    org.suspendedReason = undefined;
    org.suspendedById = undefined;
    const saved = await this.orgRepo.save(org);

    await this.auditLogService.record(
      id,
      OrganizationAuditAction.REACTIVATED,
      actorUserId,
    );

    return saved;
  }

  /**
   * Plan/Lizenz aendern (SuperAdmin), Audit-Log mit altem/neuem Wert.
   */
  async changeOrganizationPlan(
    input: ChangeOrganizationPlanInput,
    actorUserId: string,
  ): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { id: input.id } });
    if (!org) throw new NotFoundException('Organization not found');

    const before = {
      plan: org.plan,
      userLicenseLimit: org.userLicenseLimit,
      contractEndsAt: org.contractEndsAt,
      billingInterval: org.billingInterval,
      billingAmountChf: org.billingAmountChf,
    };

    org.plan = input.plan;
    if (input.userLicenseLimit !== undefined)
      org.userLicenseLimit = input.userLicenseLimit;
    if (input.contractEndsAt !== undefined)
      org.contractEndsAt = input.contractEndsAt;
    if (input.billingInterval !== undefined)
      org.billingInterval = input.billingInterval;
    if (input.billingAmountChf !== undefined)
      org.billingAmountChf = input.billingAmountChf;

    const saved = await this.orgRepo.save(org);

    await this.auditLogService.record(
      input.id,
      OrganizationAuditAction.PLAN_CHANGED,
      actorUserId,
      {
        before,
        after: {
          plan: org.plan,
          userLicenseLimit: org.userLicenseLimit,
          contractEndsAt: org.contractEndsAt,
          billingInterval: org.billingInterval,
          billingAmountChf: org.billingAmountChf,
        },
      },
    );

    return saved;
  }

  /**
   * Paginierte Audit-Log-Liste, neueste zuerst.
   */
  async getOrganizationAuditLog(
    organizationId: string,
    limit: number,
    offset: number,
  ) {
    return this.auditLogService.findPaginated(organizationId, limit, offset);
  }

  /**
   * Erzeugt einen Daten-Export-Job (minimal: synchroner Placeholder statt
   * eines vollen Job-Queue-Systems — es gibt aktuell keine Queue-Infra
   * (BullMQ o.ae.) im Repo). Der Audit-Log-Eintrag dokumentiert den Export
   * unabhaengig davon, ob der eigentliche Datei-Export spaeter asynchron
   * nachgezogen wird.
   */
  async exportOrganizationData(
    id: string,
    actorUserId: string,
  ): Promise<ExportOrganizationDataResult> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    const jobId = `export-${id}-${Date.now()}`;

    await this.auditLogService.record(
      id,
      OrganizationAuditAction.DATA_EXPORTED,
      actorUserId,
      { jobId },
    );

    return { jobId, status: 'QUEUED' };
  }

  /**
   * Liefert den ORG_OWNER-Membership-User einer Organisation — das einzige
   * Impersonation-Ziel für Support-Impersonation (kein Picker, siehe
   * Phase-6-Plan). Null, falls kein Owner mit ORG_OWNER-Rolle existiert.
   */
  async getOrganizationOwner(organizationId: string): Promise<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null> {
    const rows: Array<{
      user_id: string;
      first_name: string;
      last_name: string;
      email: string;
    }> = await this.entityManager.query(
      `SELECT u.id AS user_id, u.first_name, u.last_name, ue.email AS email
         FROM memberships m
         INNER JOIN membership_roles mr ON mr.membership_id = m.id
         INNER JOIN roles r ON r.id = mr.role_id
         INNER JOIN users u ON u.id = m.user_id
         INNER JOIN user_emails ue ON ue.user_id = u.id AND ue.is_primary = true
         WHERE m.organization_id = $1 AND r.system_code = $2
         LIMIT 1`,
      [organizationId, SystemRole.ORG_OWNER],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
    };
  }
}
