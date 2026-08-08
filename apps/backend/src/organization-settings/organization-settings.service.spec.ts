import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrganizationSettingsService } from './organization-settings.service';
import { OrganizationSetting } from './entities/organization-setting.entity';
import { EncryptionService } from './encryption.service';

describe('OrganizationSettingsService', () => {
  let service: OrganizationSettingsService;
  let repo: {
    find: jest.Mock;
    findOne: jest.Mock;
    exist: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let encryption: { encrypt: jest.Mock; decrypt: jest.Mock };

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      exist: jest.fn(),
      create: jest.fn().mockImplementation((e) => e),
      save: jest
        .fn()
        .mockImplementation((e) => Promise.resolve({ id: 's-1', ...e })),
    };
    encryption = {
      encrypt: jest.fn().mockReturnValue({
        encryptedValue: 'enc-value',
        iv: 'iv-value',
        authTag: 'auth-tag-value',
      }),
      decrypt: jest.fn().mockReturnValue('plain-value'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationSettingsService,
        { provide: getRepositoryToken(OrganizationSetting), useValue: repo },
        { provide: EncryptionService, useValue: encryption },
        { provide: EntityManager, useValue: {} },
      ],
    }).compile();

    service = module.get(OrganizationSettingsService);
  });

  describe('setDecryptedValue', () => {
    it('creates a new encrypted setting when none exists yet', async () => {
      repo.findOne.mockResolvedValue(null);

      await service.setDecryptedValue(
        'org-1',
        'my-key',
        'secret-value',
        'A description',
      );

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', key: 'MY-KEY' },
      });
      expect(encryption.encrypt).toHaveBeenCalledWith('secret-value');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          key: 'MY-KEY',
          encryptedValue: 'enc-value',
          iv: 'iv-value',
          authTag: 'auth-tag-value',
          description: 'A description',
        }),
      );
      expect(repo.save).toHaveBeenCalled();
    });

    it('updates the existing setting and reactivates it', async () => {
      const existing = {
        id: 's-1',
        organizationId: 'org-1',
        key: 'MY-KEY',
        encryptedValue: 'old-enc',
        iv: 'old-iv',
        authTag: 'old-auth-tag',
        description: 'Old description',
        isActive: false,
      };
      repo.findOne.mockResolvedValue(existing);

      await service.setDecryptedValue('org-1', 'my-key', 'new-secret');

      expect(encryption.encrypt).toHaveBeenCalledWith('new-secret');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 's-1',
          encryptedValue: 'enc-value',
          iv: 'iv-value',
          authTag: 'auth-tag-value',
          isActive: true,
          // no description passed -> existing description is preserved
          description: 'Old description',
        }),
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('overwrites the description on update when a new one is provided', async () => {
      const existing = {
        id: 's-1',
        organizationId: 'org-1',
        key: 'MY-KEY',
        encryptedValue: 'old-enc',
        iv: 'old-iv',
        authTag: 'old-auth-tag',
        description: 'Old description',
        isActive: true,
      };
      repo.findOne.mockResolvedValue(existing);

      await service.setDecryptedValue(
        'org-1',
        'my-key',
        'new-secret',
        'New description',
      );

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'New description' }),
      );
    });

    it('normalizes the key to uppercase', async () => {
      repo.findOne.mockResolvedValue(null);

      await service.setDecryptedValue('org-1', '  lower-case-key  ', 'v');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', key: 'LOWER-CASE-KEY' },
      });
    });
  });
});
