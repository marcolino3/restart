import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamAccessService } from './team-access.service';
import { Team } from './entities/team.entity';
import { TeamMemberRole } from '../team-members/entities/team-member-role.enum';

const ORG = 'org-1';
const EMPLOYEE = 'emp-1';

describe('TeamAccessService', () => {
  let service: TeamAccessService;
  let repo: jest.Mocked<Pick<Repository<Team>, 'query' | 'find'>>;

  beforeEach(async () => {
    repo = {
      query: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamAccessService,
        { provide: getRepositoryToken(Team), useValue: repo },
      ],
    }).compile();

    service = module.get<TeamAccessService>(TeamAccessService);
  });

  describe('getEffectiveTeamRoles', () => {
    it('maps rows and scopes the query to employee + organization', async () => {
      repo.query.mockResolvedValue([
        { team_id: 't1', role: 'LEAD' },
        { team_id: 't2', role: 'MEMBER' },
      ]);

      const result = await service.getEffectiveTeamRoles(ORG, EMPLOYEE);

      expect(result).toEqual([
        { teamId: 't1', role: TeamMemberRole.LEAD },
        { teamId: 't2', role: TeamMemberRole.MEMBER },
      ]);
      // params are [employeeId, organizationId]
      expect(repo.query).toHaveBeenCalledWith(expect.any(String), [
        EMPLOYEE,
        ORG,
      ]);
    });
  });

  describe('getAccessibleEmployeeIds', () => {
    it('always includes the requesting employee, de-duplicated', async () => {
      repo.query.mockResolvedValue([
        { employee_id: 'emp-2' },
        { employee_id: EMPLOYEE },
      ]);

      const ids = await service.getAccessibleEmployeeIds(ORG, EMPLOYEE);

      expect(ids).toContain(EMPLOYEE);
      expect(ids).toContain('emp-2');
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('returns at least the employee itself when in no teams', async () => {
      repo.query.mockResolvedValue([]);

      const ids = await service.getAccessibleEmployeeIds(ORG, EMPLOYEE);

      expect(ids).toEqual([EMPLOYEE]);
    });
  });

  describe('getEffectiveTeamRolesForMembership', () => {
    it('returns [] when the membership has no employee record', async () => {
      // first query = membership → employee lookup returns no employee
      repo.query.mockResolvedValueOnce([{ employee_id: null }]);

      const result = await service.getEffectiveTeamRolesForMembership(
        ORG,
        'mem-1',
      );

      expect(result).toEqual([]);
    });

    it('resolves the employee, then its effective team roles', async () => {
      repo.query
        .mockResolvedValueOnce([{ employee_id: EMPLOYEE }]) // membership lookup
        .mockResolvedValueOnce([{ team_id: 't1', role: 'LEAD' }]); // roles CTE

      const result = await service.getEffectiveTeamRolesForMembership(
        ORG,
        'mem-1',
      );

      expect(result).toEqual([{ teamId: 't1', role: TeamMemberRole.LEAD }]);
    });
  });

  describe('getAccessibleTeamsForMembership', () => {
    it('loads the Team entities and pairs them with the effective role', async () => {
      repo.query
        .mockResolvedValueOnce([{ employee_id: EMPLOYEE }]) // membership lookup
        .mockResolvedValueOnce([{ team_id: 't1', role: 'LEAD' }]); // roles CTE
      repo.find.mockResolvedValue([
        { id: 't1', name: 'Schulleitung', organizationId: ORG } as Team,
      ]);

      const result = await service.getAccessibleTeamsForMembership(
        ORG,
        'mem-1',
      );

      expect(result).toEqual([
        {
          team: expect.objectContaining({ id: 't1' }),
          effectiveRole: TeamMemberRole.LEAD,
        },
      ]);
    });

    it('returns [] without hitting the DB when there are no roles', async () => {
      repo.query.mockResolvedValueOnce([{ employee_id: EMPLOYEE }]); // membership
      repo.query.mockResolvedValueOnce([]); // no roles

      const result = await service.getAccessibleTeamsForMembership(
        ORG,
        'mem-1',
      );

      expect(result).toEqual([]);
      expect(repo.find).not.toHaveBeenCalled();
    });
  });
});
