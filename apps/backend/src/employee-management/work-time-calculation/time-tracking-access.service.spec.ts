import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TimeTrackingAccessService } from './time-tracking-access.service';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { Membership } from '@/memberships/entities/membership.entity';
import { TeamMember } from '@/employee-management/team-members/entities/team-member.entity';
import { TeamMemberRole } from '@/employee-management/team-members/entities/team-member-role.enum';
import { TeamAccessService } from '@/employee-management/teams/team-access.service';

type Mocked<T> = { [K in keyof T]: jest.Mock };

describe('TimeTrackingAccessService', () => {
  let service: TimeTrackingAccessService;
  let membershipRepo: Mocked<Pick<Repository<Membership>, 'findOne'>>;
  let teamMemberRepo: Mocked<Pick<Repository<TeamMember>, 'find'>>;
  let teamAccess: Mocked<Pick<TeamAccessService, 'getEffectiveTeamRoles'>>;

  // Caller-Membership → employeeId 'CALLER'
  const callerUser = (overrides: Partial<TokenPayload> = {}): TokenPayload => ({
    sub: 'user-1',
    orgId: 'org-1',
    membershipId: 'm-1',
    roles: [SystemRole.EMPLOYEE],
    ...overrides,
  });

  beforeEach(() => {
    membershipRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'm-1', employeeId: 'CALLER' }),
    };
    teamMemberRepo = { find: jest.fn().mockResolvedValue([]) };
    teamAccess = { getEffectiveTeamRoles: jest.fn().mockResolvedValue([]) };
    service = new TimeTrackingAccessService(
      membershipRepo as unknown as Repository<Membership>,
      teamMemberRepo as unknown as Repository<TeamMember>,
      teamAccess as unknown as TeamAccessService,
    );
  });

  describe('assertCanViewEmployee', () => {
    it('erlaubt eigene Daten', async () => {
      await expect(
        service.assertCanViewEmployee(callerUser(), 'CALLER'),
      ).resolves.toBeUndefined();
    });

    it('erlaubt HR_MANAGER Zugriff auf fremde Daten', async () => {
      await expect(
        service.assertCanViewEmployee(
          callerUser({ roles: [SystemRole.HR_MANAGER] }),
          'OTHER',
        ),
      ).resolves.toBeUndefined();
    });

    it('erlaubt SuperAdmin alles', async () => {
      await expect(
        service.assertCanViewEmployee(
          callerUser({ isSuperAdmin: true }),
          'OTHER',
        ),
      ).resolves.toBeUndefined();
    });

    it('erlaubt Teamleiter Zugriff auf Mitarbeiter geleiteter Teams', async () => {
      teamAccess.getEffectiveTeamRoles.mockResolvedValue([
        { teamId: 'T1', role: TeamMemberRole.LEAD },
      ]);
      teamMemberRepo.find.mockResolvedValue([{ employeeId: 'OTHER' }]);
      await expect(
        service.assertCanViewEmployee(
          callerUser({ roles: [SystemRole.TEAM_LEAD] }),
          'OTHER',
        ),
      ).resolves.toBeUndefined();
    });

    it('verweigert Teamleiter Zugriff ausserhalb seiner Teams', async () => {
      teamAccess.getEffectiveTeamRoles.mockResolvedValue([
        { teamId: 'T1', role: TeamMemberRole.LEAD },
      ]);
      teamMemberRepo.find.mockResolvedValue([{ employeeId: 'SOMEONE_ELSE' }]);
      await expect(
        service.assertCanViewEmployee(
          callerUser({ roles: [SystemRole.TEAM_LEAD] }),
          'OTHER',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('verweigert reinem Mitarbeiter Zugriff auf fremde Daten', async () => {
      await expect(
        service.assertCanViewEmployee(callerUser(), 'OTHER'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('verweigert Rolle ohne Admin-Anspruch Zugriff auf fremde Daten (nur ORG_ADMIN/HR_MANAGER)', async () => {
      await expect(
        service.assertCanViewEmployee(
          callerUser({ roles: [SystemRole.EMPLOYEE] }),
          'OTHER',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('ignoriert reine MEMBER-Teamrollen (kein Lead → kein Zugriff)', async () => {
      teamAccess.getEffectiveTeamRoles.mockResolvedValue([
        { teamId: 'T1', role: TeamMemberRole.MEMBER },
      ]);
      await expect(
        service.assertCanViewEmployee(
          callerUser({ roles: [SystemRole.TEAM_LEAD] }),
          'OTHER',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('assertCanManageEmployee', () => {
    it('erlaubt self und Admin, aber NICHT Teamleiter für fremde', async () => {
      await expect(
        service.assertCanManageEmployee(callerUser(), 'CALLER'),
      ).resolves.toBeUndefined();
      await expect(
        service.assertCanManageEmployee(
          callerUser({ roles: [SystemRole.ORG_ADMIN] }),
          'OTHER',
        ),
      ).resolves.toBeUndefined();
      await expect(
        service.assertCanManageEmployee(
          callerUser({ roles: [SystemRole.TEAM_LEAD] }),
          'OTHER',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('verweigert Rolle ohne Admin-Anspruch das Verwalten fremder Daten', async () => {
      await expect(
        service.assertCanManageEmployee(
          callerUser({ roles: [SystemRole.EMPLOYEE] }),
          'OTHER',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('assertCanManageAbsence', () => {
    it('erlaubt Teamleiter Absenzen für Mitarbeiter geleiteter Teams', async () => {
      teamAccess.getEffectiveTeamRoles.mockResolvedValue([
        { teamId: 'T1', role: TeamMemberRole.LEAD },
      ]);
      teamMemberRepo.find.mockResolvedValue([{ employeeId: 'OTHER' }]);
      await expect(
        service.assertCanManageAbsence(
          callerUser({ roles: [SystemRole.TEAM_LEAD] }),
          'OTHER',
        ),
      ).resolves.toBeUndefined();
    });

    it('verweigert Teamleiter Absenzen ausserhalb seiner Teams', async () => {
      teamAccess.getEffectiveTeamRoles.mockResolvedValue([
        { teamId: 'T1', role: TeamMemberRole.LEAD },
      ]);
      teamMemberRepo.find.mockResolvedValue([{ employeeId: 'SOMEONE_ELSE' }]);
      await expect(
        service.assertCanManageAbsence(
          callerUser({ roles: [SystemRole.TEAM_LEAD] }),
          'OTHER',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('erlaubt ORG_ADMIN/HR_MANAGER und Self', async () => {
      await expect(
        service.assertCanManageAbsence(callerUser(), 'CALLER'),
      ).resolves.toBeUndefined();
      await expect(
        service.assertCanManageAbsence(
          callerUser({ roles: [SystemRole.HR_MANAGER] }),
          'OTHER',
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('resolveOverviewScope', () => {
    it('ORG_ADMIN → null (alle), reiner Mitarbeiter → [] (keine)', async () => {
      await expect(
        service.resolveOverviewScope(
          callerUser({ roles: [SystemRole.ORG_ADMIN] }),
          'org-1',
        ),
      ).resolves.toBeNull();
      await expect(
        service.resolveOverviewScope(callerUser(), 'org-1'),
      ).resolves.toEqual([]);
    });

    it('Rolle ohne Lead → [] (kein Zugriff auf die Auswertung)', async () => {
      await expect(
        service.resolveOverviewScope(
          callerUser({ roles: [SystemRole.EMPLOYEE] }),
          'org-1',
        ),
      ).resolves.toEqual([]);
    });

    it('Teamleiter → IDs der geleiteten Teams', async () => {
      teamAccess.getEffectiveTeamRoles.mockResolvedValue([
        { teamId: 'T1', role: TeamMemberRole.LEAD },
      ]);
      teamMemberRepo.find.mockResolvedValue([
        { employeeId: 'A' },
        { employeeId: 'B' },
      ]);
      await expect(
        service.resolveOverviewScope(
          callerUser({ roles: [SystemRole.TEAM_LEAD] }),
          'org-1',
        ),
      ).resolves.toEqual(['A', 'B']);
    });
  });
});
