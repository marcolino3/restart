import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { AuthAccountsService } from './auth-accounts.service';
import { AuthAccount } from './entities/auth-account.entity';
import { AuthProvider } from './interfaces/auth-provider.enum';

const mockAuthAccount = (overrides: Partial<AuthAccount> = {}): AuthAccount =>
  ({
    id: 'aa-1',
    userEmailId: 'ue-1',
    provider: AuthProvider.GOOGLE,
    providerId: 'google-123',
    ...overrides,
  }) as AuthAccount;

describe('AuthAccountsService', () => {
  let service: AuthAccountsService;
  let repo: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 'aa-new', ...data })),
      findOneBy: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthAccountsService,
        { provide: getRepositoryToken(AuthAccount), useValue: repo },
      ],
    }).compile();

    service = module.get<AuthAccountsService>(AuthAccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByProviderAndId', () => {
    it('looks up by provider AND providerId', async () => {
      const account = mockAuthAccount();
      repo.findOne.mockResolvedValue(account);

      const result = await service.findByProviderAndId(
        AuthProvider.GOOGLE,
        'google-123',
      );
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { provider: AuthProvider.GOOGLE, providerId: 'google-123' },
      });
      expect(result).toBe(account);
    });

    it('returns null when no account matches', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.findByProviderAndId(AuthProvider.APPLE, 'missing'),
      ).resolves.toBeNull();
    });
  });

  describe('findByUserEmailId', () => {
    it('filters strictly by the given userEmailId (user-scoped)', async () => {
      const accounts = [mockAuthAccount()];
      repo.find.mockResolvedValue(accounts);

      const result = await service.findByUserEmailId('ue-1');
      expect(repo.find).toHaveBeenCalledWith({
        where: { userEmailId: 'ue-1' },
      });
      expect(result).toBe(accounts);
    });
  });

  describe('linkProvider', () => {
    it('creates and saves a new auth account for the user email', async () => {
      const result = await service.linkProvider(
        'ue-1',
        AuthProvider.APPLE,
        'apple-456',
      );
      expect(repo.create).toHaveBeenCalledWith({
        userEmailId: 'ue-1',
        provider: AuthProvider.APPLE,
        providerId: 'apple-456',
      });
      expect(repo.save).toHaveBeenCalledWith({
        userEmailId: 'ue-1',
        provider: AuthProvider.APPLE,
        providerId: 'apple-456',
      });
      expect(result.id).toBe('aa-new');
    });
  });

  describe('unlinkProvider', () => {
    it('removes the auth account when it exists', async () => {
      const account = mockAuthAccount();
      repo.findOneBy.mockResolvedValue(account);

      await service.unlinkProvider('aa-1');
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'aa-1' });
      expect(repo.remove).toHaveBeenCalledWith(account);
    });

    it('throws NotFoundException when the auth account does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.unlinkProvider('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });
});
