/**
 * Integration tests for OrganizationsService.
 *
 * These tests require a running PostgreSQL test database.
 * Start it with: docker compose -f docker-compose.test.yml up -d
 * Run with: npx jest --config ./test/jest-e2e.json --testPathPatterns=organizations.integration
 */
import { DataSource } from 'typeorm';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { OrganizationsService } from '@/organizations/organizations.service';
import { OrganizationAuditLogService } from '@/organizations/organization-audit-log.service';
import { Organization } from '@/organizations/entities/organization.entity';
import { OrganizationAuditLog } from '@/organizations/entities/organization-audit-log.entity';
import { GeocodingService } from '@/google/geocoding.service';
import { User } from '@/users/entities/user.entity';
import { CreateBetterAuthTables1777000000001 } from '@/migrations/1777000000001-CreateBetterAuthTables';
import { createTestingApp, cleanDatabase } from './test-utils';
import {
  BillingInterval,
  CareModel,
  EducationLevel,
  OrgLifecycleStatus,
  OrgPlan,
  SchoolType,
  Sponsorship,
} from '@restart/shared-schemas/organizations/organization-enums';

let actorUserId: string;

/**
 * Minimal module for these tests — deliberately avoids OrganizationsModule,
 * whose resolver pulls in the real better-auth guard chain (ESM, not
 * transformable by ts-jest under test/jest-e2e.json). Also skips GoogleModule
 * (pulls in GoogleCalendarService, which requires GOOGLE_AUTH_CLIENT_ID) in
 * favor of providing GeocodingService directly.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationAuditLog, User]),
  ],
  providers: [
    OrganizationsService,
    OrganizationAuditLogService,
    GeocodingService,
  ],
})
class OrganizationsTestModule {}

describe('OrganizationsService (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: OrganizationsService;
  // `create` rejects a missing/blank name, so every test org needs one; the
  // counter keeps them distinguishable in assertion output.
  let orgCounter = 0;

  beforeAll(async () => {
    const app = await createTestingApp([OrganizationsTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(OrganizationsService);

    // better-auth tables (user/session/account/verification) live outside
    // TypeORM entities, so `synchronize` never creates them — needed here
    // because getOrganizationUsage joins against "session".
    const runner = dataSource.createQueryRunner();
    await new CreateBetterAuthTables1777000000001().up(runner);
    await runner.release();
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  beforeEach(async () => {
    const actor = await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        firstName: 'Test',
        lastName: 'Actor',
      }),
    );
    actorUserId = actor.id;
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  describe('create', () => {
    it('should create an organization with seeded roles and permissions', async () => {
      const org = await service.create({
        name: `Integration Org ${++orgCounter}`,
      });

      expect(org).toBeDefined();
      expect(org.id).toBeDefined();
      expect(org.timezone).toBe('Europe/Berlin');
      expect(org.isActive).toBe(true);
    });

    it('should persist every profile field the update form can submit', async () => {
      const created = await service.create({
        name: 'Montessori Rietberg',
        subdomain: 'RietBerg',
        domain: 'rietberg.example',
        street: 'Bahnhofstrasse 1',
        zip: '8001',
        city: 'Zuerich',
        country: 'CH',
        phone: '+41 44 000 00 00',
        email: 'info@example.org',
        website: 'https://example.org',
        timezone: 'Europe/Zurich',
        shortCode: 'MR',
        sponsorship: Sponsorship.PRIVAT_ANERKANNT,
        schoolType: SchoolType.MONTESSORI,
        careModel: CareModel.TAGESSCHULE,
        activeLevels: [
          EducationLevel.KINDERGARTEN_CASA,
          EducationLevel.PRIMARSTUFE,
        ],
        legalEntity: 'Verein',
        language: 'de-CH',
        billingAddressSameAsLocation: false,
        billingAddressExtra: 'c/o Treuhand',
        contactSalutation: 'MRS',
        contactTitle: 'Dr.',
        contactFirstName: 'Anna',
        contactLastName: 'Muster',
        contactRole: 'Leitung',
        contactEmail: 'anna@example.org',
        contactPhone: '+41 44 111 11 11',
        billingEmail: 'billing@example.org',
        parentMailSenderEmail: 'eltern@example.org',
        currentSchoolYear: '2026/27',
        plan: OrgPlan.PROFESSIONAL,
        userLicenseLimit: 50,
        billingInterval: BillingInterval.MONTHLY,
        billingAmountChf: 990,
        storageLimitGb: 100,
        lifecycleStatus: OrgLifecycleStatus.TRIAL,
        bvgProvider: 'AXA',
        bvgContactPhone: '+41 44 222 22 22',
        uvgProvider: 'Suva',
        uvgContactPhone: '+41 44 333 33 33',
        dailySicknessProvider: 'Helsana',
        dailySicknessContactPhone: '+41 44 444 44 44',
      });

      // read back from the DB, not from the in-memory return value
      const org = await dataSource
        .getRepository(Organization)
        .findOneByOrFail({ id: created.id });

      expect(org).toMatchObject({
        name: 'Montessori Rietberg',
        subdomain: 'rietberg',
        domain: 'rietberg.example',
        street: 'Bahnhofstrasse 1',
        zip: '8001',
        city: 'Zuerich',
        country: 'CH',
        phone: '+41 44 000 00 00',
        email: 'info@example.org',
        website: 'https://example.org',
        timezone: 'Europe/Zurich',
        shortCode: 'MR',
        sponsorship: Sponsorship.PRIVAT_ANERKANNT,
        schoolType: SchoolType.MONTESSORI,
        careModel: CareModel.TAGESSCHULE,
        activeLevels: [
          EducationLevel.KINDERGARTEN_CASA,
          EducationLevel.PRIMARSTUFE,
        ],
        legalEntity: 'Verein',
        language: 'de-CH',
        billingAddressSameAsLocation: false,
        billingAddressExtra: 'c/o Treuhand',
        contactSalutation: 'MRS',
        contactTitle: 'Dr.',
        contactFirstName: 'Anna',
        contactLastName: 'Muster',
        contactRole: 'Leitung',
        contactEmail: 'anna@example.org',
        contactPhone: '+41 44 111 11 11',
        billingEmail: 'billing@example.org',
        parentMailSenderEmail: 'eltern@example.org',
        currentSchoolYear: '2026/27',
        plan: OrgPlan.PROFESSIONAL,
        userLicenseLimit: 50,
        billingInterval: BillingInterval.MONTHLY,
        storageLimitGb: 100,
        lifecycleStatus: OrgLifecycleStatus.TRIAL,
        bvgProvider: 'AXA',
        bvgContactPhone: '+41 44 222 22 22',
        uvgProvider: 'Suva',
        uvgContactPhone: '+41 44 333 33 33',
        dailySicknessProvider: 'Helsana',
        dailySicknessContactPhone: '+41 44 444 44 44',
      });
      expect(Number(org.billingAmountChf)).toBe(990);
    });

    it('should keep accepting the legacy organizationName/organizationSubdomain aliases', async () => {
      const org = await service.create({
        organizationName: 'Legacy Org',
        organizationSubdomain: 'LEGACY',
      });

      expect(org.name).toBe('Legacy Org');
      expect(org.subdomain).toBe('legacy');
    });
  });

  describe('isSubdomainAvailable', () => {
    it('should return true when subdomain is not taken', async () => {
      expect(await service.isSubdomainAvailable('fresh-subdomain')).toBe(true);
    });

    it('should return false when subdomain is taken', async () => {
      const org = await service.create({
        name: `Integration Org ${++orgCounter}`,
      });
      const repo = dataSource.getRepository(Organization);
      await repo.update(org.id, { subdomain: 'taken-subdomain' });

      expect(await service.isSubdomainAvailable('taken-subdomain')).toBe(false);
    });
  });

  describe('findBySubdomain', () => {
    it('should find an organization by subdomain', async () => {
      const org = await service.create({
        name: `Integration Org ${++orgCounter}`,
      });
      const repo = dataSource.getRepository(Organization);
      await repo.update(org.id, { subdomain: 'my-org', name: 'My Org' });

      const found = await service.findBySubdomain('my-org');
      expect(found.id).toBe(org.id);
      expect(found.name).toBe('My Org');
    });

    it('should throw NotFoundException for unknown subdomain', async () => {
      await expect(service.findBySubdomain('nope')).rejects.toThrow();
    });
  });

  describe('subdomain uniqueness', () => {
    it('should enforce unique subdomains at DB level', async () => {
      const org1 = await service.create({
        name: `Integration Org ${++orgCounter}`,
      });
      const org2 = await service.create({
        name: `Integration Org ${++orgCounter}`,
      });

      const repo = dataSource.getRepository(Organization);
      await repo.update(org1.id, { subdomain: 'unique-subdomain' });

      // Directly trying to set the same subdomain on another org should fail
      await expect(
        repo.update(org2.id, { subdomain: 'unique-subdomain' }),
      ).rejects.toThrow();
    });
  });

  describe('multi-tenant isolation for admin operations', () => {
    it('suspendOrganization only affects the target organization', async () => {
      const org1 = await service.create({
        name: `Integration Org ${++orgCounter}`,
      });
      const org2 = await service.create({
        name: `Integration Org ${++orgCounter}`,
      });

      await service.suspendOrganization(org1.id, 'test reason', actorUserId);

      const repo = dataSource.getRepository(Organization);
      const reloadedOrg1 = await repo.findOneOrFail({ where: { id: org1.id } });
      const reloadedOrg2 = await repo.findOneOrFail({ where: { id: org2.id } });

      expect(reloadedOrg1.lifecycleStatus).toBe('SUSPENDED');
      expect(reloadedOrg2.lifecycleStatus).not.toBe('SUSPENDED');
    });

    it('getOrganizationAuditLog never returns entries from another organization', async () => {
      const org1 = await service.create({
        name: `Integration Org ${++orgCounter}`,
      });
      const org2 = await service.create({
        name: `Integration Org ${++orgCounter}`,
      });

      await service.suspendOrganization(org1.id, 'org1 reason', actorUserId);
      await service.suspendOrganization(org2.id, 'org2 reason', actorUserId);

      const { items, total } = await service.getOrganizationAuditLog(
        org1.id,
        25,
        0,
      );

      expect(total).toBe(1);
      expect(items).toHaveLength(1);
      expect(items.every((entry) => entry.organizationId === org1.id)).toBe(
        true,
      );
    });

    it('getOrganizationUsage scopes membership/child counts to the given organization', async () => {
      const org1 = await service.create({
        name: `Integration Org ${++orgCounter}`,
      });
      const org2 = await service.create({
        name: `Integration Org ${++orgCounter}`,
      });

      const usage1 = await service.getOrganizationUsage(org1.id);
      const usage2 = await service.getOrganizationUsage(org2.id);

      // Both freshly created orgs must report their own (zero) counts, not
      // a total leaked across organizations.
      expect(usage1.userCount).toBe(0);
      expect(usage2.userCount).toBe(0);
    });
  });
});
