import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { MembershipGuard } from '@/auth/guard/membership.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { SickLeaveResolver } from './sick-leave.resolver';
import { SickLeaveService } from './sick-leave.service';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';

const callerOfOrgA = {
  sub: 'user-1',
  orgId: ORG_ID,
  membershipId: 'membership-1',
} as unknown as TokenPayload;

const callerOfOrgB = {
  sub: 'user-2',
  orgId: OTHER_ORG_ID,
  membershipId: 'membership-2',
} as unknown as TokenPayload;

/** Prototype method without member access — satisfies the unbound-method rule. */
const methodOf = (name: keyof SickLeaveResolver): object =>
  Object.getOwnPropertyDescriptor(SickLeaveResolver.prototype, name)
    ?.value as object;

describe('SickLeaveResolver', () => {
  let resolver: SickLeaveResolver;
  let service: { reportSickLeave: jest.Mock };

  beforeEach(async () => {
    service = {
      reportSickLeave: jest.fn().mockResolvedValue({
        absence: { id: 'absence-1' },
        isExtension: false,
        isUnchanged: false,
      }),
    };

    // The guards are asserted through their metadata below; instantiating them
    // would drag the whole auth graph into this unit test.
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SickLeaveResolver,
        { provide: SickLeaveService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(MembershipGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get(SickLeaveResolver);
  });

  describe('guards', () => {
    it('sits behind authentication and access guards', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        SickLeaveResolver,
      ) as unknown[];

      expect(guards).toContain(GqlBetterAuthGuard);
      expect(guards).toContain(GraphQLAccessGuard);
    });

    it('requires a verified membership on the mutation', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        methodOf('reportSickLeave'),
      ) as unknown[];

      expect(guards).toContain(MembershipGuard);
    });

    it('carries no permission code — self-service for the caller only', () => {
      // Intentional: like `createEmployeeAbsenceNotice`, an employee reports
      // for themselves. Adding a permission here would lock out exactly the
      // people the feature exists for.
      const permissions = Reflect.getMetadata(
        PERMS_KEY,
        methodOf('reportSickLeave'),
      ) as unknown;

      expect(permissions).toBeUndefined();
    });
  });

  describe('reportSickLeave', () => {
    it('passes the token through untouched, never an org from the input', async () => {
      const input = { date: '2026-03-02', comment: 'Grippe' };

      await resolver.reportSickLeave(input, callerOfOrgA);

      expect(service.reportSickLeave).toHaveBeenCalledWith(input, callerOfOrgA);
    });

    it('cannot be steered into another tenant via the input payload', async () => {
      // A crafted payload carrying a foreign organizationId must not reach the
      // service as anything other than inert extra data — the tenant always
      // comes from the token.
      const hostileInput = {
        date: '2026-03-02',
        organizationId: OTHER_ORG_ID,
        employeeId: 'foreign-employee',
      } as unknown as { date: string };

      await resolver.reportSickLeave(hostileInput, callerOfOrgA);

      const [, forwardedUser] = service.reportSickLeave.mock.calls[0] as [
        unknown,
        TokenPayload,
      ];
      expect(forwardedUser.orgId).toBe(ORG_ID);
      expect(forwardedUser.membershipId).toBe('membership-1');
    });

    it('forwards each caller with their own organization', async () => {
      await resolver.reportSickLeave({ date: '2026-03-02' }, callerOfOrgA);
      await resolver.reportSickLeave({ date: '2026-03-02' }, callerOfOrgB);

      const orgs = service.reportSickLeave.mock.calls.map(
        (call) => (call[1] as TokenPayload).orgId,
      );
      expect(orgs).toEqual([ORG_ID, OTHER_ORG_ID]);
    });

    it('returns the outcome flags so the client can tell a duplicate apart', async () => {
      service.reportSickLeave.mockResolvedValue({
        absence: { id: 'absence-1' },
        isExtension: false,
        isUnchanged: true,
      });

      const result = await resolver.reportSickLeave(
        { date: '2026-03-02' },
        callerOfOrgA,
      );

      // Regression: the resolver used to return only the absence, so the UI
      // showed a success toast for a report that wrote nothing.
      expect(result).toEqual({
        absence: { id: 'absence-1' },
        isExtension: false,
        isUnchanged: true,
      });
    });

    it('surfaces the extension flag unchanged', async () => {
      service.reportSickLeave.mockResolvedValue({
        absence: { id: 'absence-1' },
        isExtension: true,
        isUnchanged: false,
      });

      const result = await resolver.reportSickLeave(
        { date: '2026-03-03' },
        callerOfOrgA,
      );

      expect(result.isExtension).toBe(true);
    });
  });
});
