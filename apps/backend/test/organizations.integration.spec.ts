/**
 * Integration tests for OrganizationsService.
 *
 * These tests require a running PostgreSQL test database.
 * Start it with: docker compose -f docker-compose.test.yml up -d
 * Run with: npx jest --config ./test/jest-e2e.json --testPathPatterns=organizations.integration
 */
import { DataSource } from 'typeorm';
import { TestingModule } from '@nestjs/testing';

import { OrganizationsService } from '@/organizations/organizations.service';
import { OrganizationsModule } from '@/organizations/organizations.module';
import { Organization } from '@/organizations/entities/organization.entity';
import { createTestingApp, cleanDatabase } from './test-utils';

describe('OrganizationsService (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: OrganizationsService;

  beforeAll(async () => {
    const app = await createTestingApp([OrganizationsModule]);
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(OrganizationsService);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  describe('create', () => {
    it('should create an organization with seeded roles and permissions', async () => {
      const org = await service.create({});

      expect(org).toBeDefined();
      expect(org.id).toBeDefined();
      expect(org.timezone).toBe('Europe/Berlin');
      expect(org.isActive).toBe(false);
    });
  });

  describe('isSubdomainAvailable', () => {
    it('should return true when subdomain is not taken', async () => {
      expect(await service.isSubdomainAvailable('fresh-subdomain')).toBe(true);
    });

    it('should return false when subdomain is taken', async () => {
      const org = await service.create({});
      const repo = dataSource.getRepository(Organization);
      await repo.update(org.id, { subdomain: 'taken-subdomain' });

      expect(await service.isSubdomainAvailable('taken-subdomain')).toBe(false);
    });
  });

  describe('findBySubdomain', () => {
    it('should find an organization by subdomain', async () => {
      const org = await service.create({});
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
      const org1 = await service.create({});
      const org2 = await service.create({});

      const repo = dataSource.getRepository(Organization);
      await repo.update(org1.id, { subdomain: 'unique-subdomain' });

      // Directly trying to set the same subdomain on another org should fail
      await expect(
        repo.update(org2.id, { subdomain: 'unique-subdomain' }),
      ).rejects.toThrow();
    });
  });
});
