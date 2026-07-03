import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MembershipsService } from './memberships.service';
import { Membership } from './entities/membership.entity';

describe('MembershipsService', () => {
  let service: MembershipsService;
  let repository: {
    update: jest.Mock;
    manager: { update: jest.Mock };
  };

  beforeEach(async () => {
    repository = {
      update: jest.fn(),
      manager: { update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsService,
        { provide: getRepositoryToken(Membership), useValue: repository },
      ],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateMyTheme', () => {
    it('updates the theme scoped to membership AND organization', async () => {
      repository.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.updateMyTheme(
          { userId: 'user-1', membershipId: 'mem-1', organizationId: 'org-1' },
          'lagune',
        ),
      ).resolves.toBe(true);

      expect(repository.update).toHaveBeenCalledWith(
        { id: 'mem-1', organizationId: 'org-1' },
        { theme: 'lagune' },
      );
      expect(repository.manager.update).not.toHaveBeenCalled();
    });

    it('throws when the membership does not belong to the org (tenant isolation)', async () => {
      repository.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.updateMyTheme(
          {
            userId: 'user-1',
            membershipId: 'mem-1',
            organizationId: 'org-other',
          },
          'lagune',
        ),
      ).rejects.toThrow('Membership not found');
      expect(repository.manager.update).not.toHaveBeenCalled();
    });

    it('stores the theme on the user record when the caller has no membership (SuperAdmin)', async () => {
      repository.manager.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.updateMyTheme({ userId: 'user-1' }, 'lagune'),
      ).resolves.toBe(true);

      expect(repository.manager.update).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'user-1' },
        { theme: 'lagune' },
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('throws when the fallback user record does not exist', async () => {
      repository.manager.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.updateMyTheme({ userId: 'user-gone' }, 'lagune'),
      ).rejects.toThrow('User not found');
    });
  });
});
