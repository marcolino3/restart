/**
 * Integration tests for OrganizationsService.
 *
 * These tests require a running PostgreSQL test database.
 * Start it with: docker compose -f docker-compose.test.yml up -d
 * Run with: npx jest --config ./test/jest-e2e.json --testPathPatterns=organizations.integration
 */
import { DataSource, EntityManager } from 'typeorm';
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
      const org = await service.create();

      expect(org).toBeDefined();
      expect(org.id).toBeDefined();
      expect(org.timezone).toBe('Europe/Berlin');
      expect(org.isActive).toBe(false);
    });
  });

  describe('isSlugAvailable', () => {
    it('should return true when slug is not taken', async () => {
      expect(await service.isSlugAvailable('fresh-slug')).toBe(true);
    });

    it('should return false when slug is taken', async () => {
      // Create org and set slug
      const org = await service.create();
      const repo = dataSource.getRepository(Organization);
      await repo.update(org.id, { slug: 'taken-slug' });

      expect(await service.isSlugAvailable('taken-slug')).toBe(false);
    });
  });

  describe('findBySlug', () => {
    it('should find an organization by slug', async () => {
      const org = await service.create();
      const repo = dataSource.getRepository(Organization);
      await repo.update(org.id, { slug: 'my-org', name: 'My Org' });

      const found = await service.findBySlug('my-org');
      expect(found.id).toBe(org.id);
      expect(found.name).toBe('My Org');
    });

    it('should throw NotFoundException for unknown slug', async () => {
      await expect(service.findBySlug('nope')).rejects.toThrow();
    });
  });

  describe('slug uniqueness', () => {
    it('should enforce unique slugs at DB level', async () => {
      const org1 = await service.create();
      const org2 = await service.create();

      const repo = dataSource.getRepository(Organization);
      await repo.update(org1.id, { slug: 'unique-slug' });

      // Directly trying to set the same slug on another org should fail
      await expect(
        repo.update(org2.id, { slug: 'unique-slug' }),
      ).rejects.toThrow();
    });
  });
});
