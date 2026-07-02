import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { AuthAccountsService } from './auth-accounts.service';
import { AuthAccount } from './entities/auth-account.entity';
import { AuthProvider } from './interfaces/auth-provider.enum';

describe('AuthAccountsService', () => {
  let service: AuthAccountsService;
  let repo: Record<string, jest.Mock>;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data: Partial<AuthAccount>) => ({
        id: 'aa-1',
        ...data,
      })),
      save: jest.fn((entity: Partial<AuthAccount>) =>
        Promise.resolve({ id: 'aa-1', ...entity }),
      ),
      remove: jest.fn().mockResolvedValue(undefined),
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
    it('queries by provider and providerId', async () => {
      const account = { id: 'aa-1' } as AuthAccount;
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

    it('returns null when no account is found', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.findByProviderAndId(
        AuthProvider.APPLE,
        'unknown',
      );

      expect(result).toBeNull();
    });
  });

  describe('findByUserEmailId', () => {
    it('scopes the lookup to the given userEmailId', async () => {
      const accounts = [{ id: 'aa-1' }] as AuthAccount[];
      repo.find.mockResolvedValue(accounts);

      const result = await service.findByUserEmailId('ue-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { userEmailId: 'ue-1' },
      });
      expect(result).toBe(accounts);
    });
  });

  describe('linkProvider', () => {
    it('creates and persists a new auth account', async () => {
      const result = await service.linkProvider(
        'ue-1',
        AuthProvider.GOOGLE,
        'google-123',
      );

      expect(repo.create).toHaveBeenCalledWith({
        userEmailId: 'ue-1',
        provider: AuthProvider.GOOGLE,
        providerId: 'google-123',
      });
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'aa-1',
        userEmailId: 'ue-1',
        provider: AuthProvider.GOOGLE,
        providerId: 'google-123',
      });
    });
  });

  describe('unlinkProvider', () => {
    it('removes an existing auth account', async () => {
      const account = { id: 'aa-1' } as AuthAccount;
      repo.findOneBy.mockResolvedValue(account);

      await service.unlinkProvider('aa-1');

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'aa-1' });
      expect(repo.remove).toHaveBeenCalledWith(account);
    });

    it('throws NotFoundException when the account does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.unlinkProvider('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });
});
