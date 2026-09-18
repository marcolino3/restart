import { createHash } from 'node:crypto';
import type { Request } from 'express';
import { EntityManager } from 'typeorm';
import { auth } from '@/lib/auth';
import { mailer } from '@/lib/mailer';
import { AccountEmailController } from './account-email.controller';
import { AccountEmailChange } from './entities/account-email-change.entity';

jest.mock('@/lib/auth', () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock('@/lib/mailer', () => ({
  mailer: { sendAccountEmailVerification: jest.fn() },
}));

describe('account email verification', () => {
  const oldToken = 'a'.repeat(64);
  const newToken = 'b'.repeat(64);
  const digest = (value: string) =>
    createHash('sha256').update(value).digest('hex');
  const request = { headers: {} } as Request;
  let manager: Record<string, jest.Mock>;
  let controller: AccountEmailController;
  let change: AccountEmailChange;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'auth-owner', email: 'old@example.test' },
    } as never);
    manager = {
      transaction: jest.fn(
        (callback: (value: typeof manager) => Promise<unknown>) =>
          callback(manager),
      ),
      query: jest.fn().mockResolvedValue([{ email: 'old@example.test' }]),
      find: jest.fn().mockResolvedValue([{ id: 'domain-email' }]),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    change = Object.assign(new AccountEmailChange(), {
      id: 'change',
      authUserId: 'auth-owner',
      userEmailId: 'domain-email',
      oldEmail: 'old@example.test',
      newEmail: 'new@example.test',
      oldTokenHash: digest(oldToken),
      newTokenHash: digest(newToken),
      oldConfirmed: false,
      newConfirmed: false,
      expiresAt: new Date(Date.now() + 60_000),
    });
    manager.findOne.mockResolvedValue(change);
    controller = new AccountEmailController(
      manager as unknown as EntityManager,
    );
  });

  it('rejects anonymous requests before accessing the database', async () => {
    jest.mocked(auth.api.getSession).mockResolvedValue(null);
    await expect(
      controller.request({ email: 'new@example.test' }, request),
    ).rejects.toThrow('Sign in');
    expect(manager.transaction).not.toHaveBeenCalled();
  });

  it('rejects unchanged addresses without issuing tokens', async () => {
    await expect(
      controller.request({ email: 'old@example.test' }, request),
    ).rejects.toThrow('different email');
    expect(manager.save).not.toHaveBeenCalled();
    expect(mailer.sendAccountEmailVerification).not.toHaveBeenCalled();
  });

  it('rejects requests made with a stale account email', async () => {
    manager.query.mockResolvedValue([{ email: 'changed@example.test' }]);
    await expect(
      controller.request({ email: 'new@example.test' }, request),
    ).rejects.toThrow('Sign in again');
    expect(manager.save).not.toHaveBeenCalled();
  });

  it.each([0, 1])(
    'completes only when exactly one original domain address is updated (%s)',
    async (affected) => {
      change.newConfirmed = true;
      manager.findOne.mockResolvedValueOnce(change).mockResolvedValueOnce(null);
      manager.query.mockImplementation((sql: string) =>
        Promise.resolve(
          sql.includes('FOR UPDATE') ? [{ email: change.oldEmail }] : [],
        ),
      );
      manager.update.mockResolvedValue({ affected });
      const confirmation = controller.confirm({ token: oldToken }, request);
      if (affected === 0) {
        await expect(confirmation).rejects.toThrow('Account changed');
        expect(manager.delete).not.toHaveBeenCalled();
        expect(
          manager.query.mock.calls.some(([sql]) =>
            String(sql).startsWith('UPDATE "user"'),
          ),
        ).toBe(false);
      } else {
        await expect(confirmation).resolves.toEqual({ completed: true });
        expect(manager.query).toHaveBeenCalledWith(
          'DELETE FROM session WHERE "userId"=$1',
          ['auth-owner'],
        );
        expect(manager.delete).toHaveBeenCalledWith(AccountEmailChange, {
          id: change.id,
        });
      }
    },
  );

  it.each([{ addresses: [] }, { addresses: [{ id: 'one' }, { id: 'two' }] }])(
    'rejects missing or ambiguous legacy identities: %j',
    async ({ addresses }) => {
      manager.find.mockResolvedValue(addresses);
      await expect(
        controller.request({ email: 'new@example.test' }, request),
      ).rejects.toThrow('not available');
      expect(manager.delete).not.toHaveBeenCalled();
      expect(mailer.sendAccountEmailVerification).not.toHaveBeenCalled();
    },
  );

  it('stores only token hashes and sends distinct confirmations to both mailboxes', async () => {
    await expect(
      controller.request({ email: 'new@example.test' }, request),
    ).resolves.toEqual({ requested: true });
    const saved = manager.save.mock.calls[0][1];
    const calls = jest.mocked(mailer.sendAccountEmailVerification).mock.calls;
    expect(calls.map(([email]) => email)).toEqual([
      'old@example.test',
      'new@example.test',
    ]);
    const tokens = calls.map(([, url]) =>
      new URL(url).searchParams.get('token')!,
    );
    expect(tokens[0]).not.toBe(tokens[1]);
    expect(saved.oldTokenHash).toBe(digest(tokens[0]));
    expect(saved.newTokenHash).toBe(digest(tokens[1]));
    expect(JSON.stringify(saved)).not.toContain(tokens[0]);
    expect(manager.delete).toHaveBeenCalledWith(AccountEmailChange, {
      authUserId: 'auth-owner',
    });
  });

  it.each(['malformed', 'expired', 'missing', 'changed account', 'replayed'])(
    'rejects %s confirmations without changing identity',
    async (scenario) => {
      if (scenario === 'expired') change.expiresAt = new Date(0);
      if (scenario === 'missing') manager.findOne.mockResolvedValue(null);
      if (scenario === 'changed account')
        manager.query.mockResolvedValue([{ email: 'different@example.test' }]);
      if (scenario === 'replayed') change.oldConfirmed = true;
      await expect(
        controller.confirm(
          { token: scenario === 'malformed' ? 'bad' : oldToken },
          request,
        ),
      ).rejects.toThrow();
      expect(manager.update).not.toHaveBeenCalled();
      expect(manager.delete).not.toHaveBeenCalled();
    },
  );

  it.each([oldToken, newToken])(
    'a single mailbox confirmation never changes the account: %s',
    async (token) => {
      await expect(controller.confirm({ token }, request)).resolves.toEqual({
        completed: false,
      });
      expect(manager.save).toHaveBeenCalledWith(
        AccountEmailChange,
        expect.objectContaining({
          oldConfirmed: token === oldToken,
          newConfirmed: token === newToken,
        }),
      );
      expect(manager.update).not.toHaveBeenCalled();
    },
  );

  it.each(['domain', 'auth'])(
    'refuses an address already used by another %s identity',
    async (collision) => {
      change.oldConfirmed = true;
      manager.findOne
        .mockResolvedValueOnce(change)
        .mockResolvedValueOnce(collision === 'domain' ? { id: 'other' } : null);
      manager.query.mockImplementation((sql: string) => {
        if (sql.includes('FOR UPDATE'))
          return Promise.resolve([{ email: change.oldEmail }]);
        if (sql.includes('AND id<>'))
          return Promise.resolve(
            collision === 'auth' ? [{ id: 'other-auth' }] : [],
          );
        return Promise.resolve([]);
      });
      await expect(
        controller.confirm({ token: newToken }, request),
      ).rejects.toThrow('could not be completed');
      expect(manager.update).not.toHaveBeenCalled();
      expect(manager.delete).not.toHaveBeenCalled();
    },
  );
});
