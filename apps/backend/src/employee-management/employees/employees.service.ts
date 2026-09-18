import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EmployeeProfile } from './entities/employee-profile';
import { applyEmployeeBasisPatch } from './employee-basis-patch';
import { EmployeeAccountInvitation } from './entities/employee-account-invitation.entity';
import { EmployeeStorageCleanup } from './entities/employee-storage-cleanup.entity';
import { Persona } from '@/common/enums/persona.enum';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import {
  assignMembershipRoles,
  assertRoleAssignmentActor,
} from '@/roles/membership-role-assignment';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import {
  assertContractTypeFields,
  clearHiddenContractFields,
} from '@/employee-management/employee-contracts/contract-type-rules';
import { applyExclusiveScheduleFields } from '@/employee-management/employee-contracts/contract-schedule';
import { EmployeeFunction } from '@/employee-management/employee-functions/entities/employee-function.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { TeamMember } from '@/employee-management/team-members/entities/team-member.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, Not } from 'typeorm';
import { CreateEmployeeInput } from './dto/create-employee.input';
import { UpdateEmployeeInput } from './dto/update-employee.input';
import { EmployeeOnboardingInput } from './dto/employee-onboarding.input';
import {
  FinalizeEmployeeOnboardingInput,
  InvitationTiming,
} from './dto/finalize-employee-onboarding.input';
import {
  Employee,
  EmployeeStatus,
  EmployeeInvitationStatus,
} from './entities/employee.entity';
import { EmployeeInvitationService } from './employee-invitation.service';
import { PasswordService } from '@/users/password.service';
import { EmployeeAuditLogService } from '../employee-audit-log/employee-audit-log.service';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly passwordService: PasswordService,
    private readonly auditLogService: EmployeeAuditLogService,
    private readonly invitationService: EmployeeInvitationService,

    @InjectRepository(Employee)
    private readonly employeesService: Repository<Employee>,
  ) {}

  async createEmployeeMinimal(
    input: CreateEmployeeInput,
    organizationId: string,
  ): Promise<Employee> {
    return this.upsertEmployeeOnboardingDraft(
      input,
      organizationId,
      undefined,
      EmployeeStatus.ACTIVE,
    );
  }

  async updateEmployeeMinimal(
    input: UpdateEmployeeInput,
    organizationId: string,
    actorMembershipId?: string | null,
  ): Promise<Employee> {
    if (input.firstName === null || input.lastName === null)
      throw new BadRequestException('Employee names cannot be cleared');
    const existing = await this.findEmployeeById(input.id, organizationId);
    return this.upsertEmployeeOnboardingDraft(
      {
        ...input,
        firstName: input.firstName ?? existing.profile.firstName ?? '',
        lastName: input.lastName ?? existing.profile.lastName ?? '',
      },
      organizationId,
      {
        sub: '',
        orgId: organizationId,
        membershipId: actorMembershipId ?? undefined,
      },
    );
  }

  async findEmployeesByOrgId(organizationId: string) {
    if (!organizationId) throw new ForbiddenException('No active organization');
    const employees = await this.employeesService.find({
      relations: {
        membership: {
          organization: true,
          employee: true,
          roles: true,
          user: { userEmails: true },
        },
        teamMembers: {
          team: true,
        },
      },
      where: { organizationId },
    });

    if (!employees)
      throw new InternalServerErrorException('Load Employees failed');

    return employees;
  }

  async findTeachersByOrgId(organizationId: string) {
    if (!organizationId)
      throw new BadRequestException('No active organization');
    const employees = await this.employeesService.find({
      relations: {
        membership: {
          user: true,
        },
      },
      where: {
        isActive: true,
        status: EmployeeStatus.ACTIVE,
        organizationId,
        membership: {
          organizationId,
          persona: Persona.TEACHER,
        },
      },
    });
    return employees.map((employee) => ({
      id: employee.id,
      firstName: employee.profile.firstName ?? '',
      lastName: employee.profile.lastName ?? '',
      userId: employee.membership.user?.id ?? null,
    }));
  }

  async findEmployeeById(
    employeeId: string,
    organizationId: string,
  ): Promise<Employee> {
    if (!organizationId) throw new ForbiddenException('No active organization');
    const employee = await this.employeesService.findOne({
      where: { id: employeeId, organizationId },
      relations: {
        membership: {
          user: { userEmails: true },
          organization: true,
          roles: true,
          userEmail: true,
        },
        teamMembers: { team: true },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Org-Isolation pruefen
    if (employee.organizationId !== organizationId) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  /** Delete only an unlinked, uninvited draft and its inactive placeholder. */
  async removeEmployeeOnboardingDraft(
    employeeId: string,
    organizationId: string,
  ): Promise<boolean> {
    if (!organizationId) throw new NotFoundException('Employee not found');
    return this.entityManager.transaction(async (manager) => {
      await manager.findOneOrFail(Organization, {
        where: { id: organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      const employee = await manager.findOne(Employee, {
        where: { id: employeeId, organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      const membership = await manager.findOne(Membership, {
        where: { employeeId, organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (
        !employee ||
        employee.organizationId !== organizationId ||
        !membership
      )
        throw new NotFoundException('Employee not found');
      if (
        employee.status !== EmployeeStatus.DRAFT ||
        employee.invitedAt ||
        employee.accountLinkStatus !== 'UNLINKED' ||
        membership.userId ||
        membership.isActive ||
        employee.invitationStatus !== EmployeeInvitationStatus.PENDING
      ) {
        throw new BadRequestException(
          'Only unfinished, uninvited onboarding drafts can be removed this way',
        );
      }
      await manager.delete(TeamMember, { employeeId, organizationId });
      await manager.delete(EmployeeContract, { employeeId, organizationId });
      await manager.save(EmployeeStorageCleanup, {
        employeeId,
        organizationId,
      });
      await manager.update(
        Membership,
        { id: membership.id, organizationId },
        { employeeId: null },
      );
      await manager.remove(Membership, membership);
      await manager.remove(Employee, employee);
      return true;
    });
  }

  /**
   * Auto-saving upsert for the onboarding wizard. Without `id` a new DRAFT
   * employee with an inactive, unlinked membership is created; with `id`
   * the existing draft is patched. Roles, team and the contract are applied in
   * the same transaction, each validated against the caller's organization
   * (multi-tenant isolation). Only fields that are present in the input are
   * touched, so each wizard step can save its own slice.
   */
  async upsertEmployeeOnboardingDraft(
    input: EmployeeOnboardingInput,
    organizationId: string,
    actor?: TokenPayload,
    initialStatus: EmployeeStatus = EmployeeStatus.DRAFT,
  ): Promise<Employee> {
    if (!organizationId) throw new ForbiddenException('No active organization');
    if (input.email === null)
      throw new BadRequestException('Employee email cannot be cleared');
    const validation = validateSync(
      plainToInstance(EmployeeOnboardingInput, {
        ...input,
        id: undefined,
        roleIds: undefined,
        teamId: undefined,
        contract: undefined,
      }),
    );
    if (validation.length)
      throw new BadRequestException(
        `Invalid employee fields: ${validation.map((v) => v.property).join(', ')}`,
      );
    if (input.roleIds !== undefined)
      assertRoleAssignmentActor(actor, organizationId);
    return this.entityManager.transaction(async (manager) => {
      // All employee/role/link mutations acquire organization before employee
      // before invitation locks, preventing inversion during concurrent saves.
      const organization = await manager.findOne(Organization, {
        where: { id: organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!organization) throw new NotFoundException('Organization not found');
      let employee: Employee;
      let membership: Membership;
      if (input.id) {
        const existing = await manager.findOne(Employee, {
          where: { id: input.id, organizationId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!existing || existing.organizationId !== organizationId)
          throw new NotFoundException('Employee not found');
        if (!existing.profile?.firstName || !existing.profile?.lastName)
          throw new ConflictException('Employee profile migration is required');
        if (input.expectedVersion !== existing.version)
          throw new ConflictException(
            'Employee was changed; reload before saving',
          );
        employee = existing;
        membership = await manager.findOneOrFail(Membership, {
          where: { employeeId: input.id, organizationId },
        });
      } else {
        if (!input.email)
          throw new BadRequestException('E-mail is required to start a draft');
        employee = manager.create(Employee, {
          organizationId,
          profile: {},
          accountLinkStatus: 'UNLINKED',
          status: initialStatus,
          timeTrackingEnabled: input.timeTrackingEnabled ?? false,
          isActive: true,
          isArchived: false,
        });
        employee.profile = new EmployeeProfile();
        membership = manager.create(Membership, {
          organizationId,
          persona: input.persona ?? Persona.EMPLOYEE,
          userId: null,
          isActive: false,
          isArchived: false,
        });
      }
      const normalizedEmail = input.email?.trim().toLowerCase();
      if (
        input.email !== undefined &&
        employee.accountLinkStatus !== 'UNLINKED' &&
        normalizedEmail !== employee.profile.email
      ) {
        throw new BadRequestException(
          'Linked account email can only be changed by the account owner',
        );
      }
      if (normalizedEmail) {
        if (employee.id && normalizedEmail !== employee.profile.email) {
          await manager.delete(EmployeeAccountInvitation, {
            employeeId: employee.id,
            organizationId,
          });
          employee.invitationStatus = EmployeeInvitationStatus.PENDING;
          employee.invitedAt = null;
          employee.invitationScheduledSendAt = null;
        }
        const duplicate = await manager.findOne(Employee, {
          where: {
            organizationId,
            profile: { email: normalizedEmail },
            ...(employee.id ? { id: Not(employee.id) } : {}),
          },
        });
        if (duplicate)
          throw new ConflictException(
            'Employee email already exists in this organization',
          );
      }
      const changes = applyEmployeeBasisPatch(employee, membership, input);
      employee.version = (employee.version ?? 0) + 1;
      employee = await manager.save(Employee, employee);
      membership.employeeId = employee.id;
      membership = await manager.save(Membership, membership);
      if (input.id && changes.length)
        await this.auditLogService.logChanges(
          employee.id,
          organizationId,
          actor?.membershipId ?? null,
          changes,
          manager,
        );

      employee.membership = membership;
      await this.applyOnboardingRoles(
        manager,
        membership,
        input,
        organizationId,
        actor,
      );
      await this.applyOnboardingTeam(manager, employee, input, organizationId);
      await this.upsertOnboardingContract(
        manager,
        employee,
        input,
        organizationId,
      );

      return manager.findOneOrFail(Employee, {
        where: { id: employee.id },
        relations: {
          membership: { user: true, organization: true, roles: true },
        },
      });
    });
  }

  private async applyOnboardingRoles(
    manager: EntityManager,
    membership: Membership,
    input: EmployeeOnboardingInput,
    organizationId: string,
    actor?: TokenPayload,
  ): Promise<void> {
    if (input.roleIds === undefined) return;
    await assignMembershipRoles(
      manager,
      membership,
      input.roleIds,
      organizationId,
      actor,
    );
  }

  private async applyOnboardingTeam(
    manager: EntityManager,
    employee: Employee,
    input: EmployeeOnboardingInput,
    organizationId: string,
  ): Promise<void> {
    if (input.teamId === undefined) return;
    const team = await manager.findOne(Team, {
      where: { id: input.teamId, organizationId },
    });
    if (!team) {
      throw new BadRequestException(
        'Team does not belong to this organization',
      );
    }
    let teamMember = await manager.findOne(TeamMember, {
      where: { organizationId, teamId: input.teamId, employeeId: employee.id },
    });
    if (teamMember) {
      teamMember.isActive = true;
      if (input.teamRole) teamMember.role = input.teamRole;
    } else {
      teamMember = manager.create(TeamMember, {
        organizationId,
        teamId: input.teamId,
        employeeId: employee.id,
        role: input.teamRole ?? undefined,
      });
    }
    await manager.save(TeamMember, teamMember);
  }

  private async upsertOnboardingContract(
    manager: EntityManager,
    employee: Employee,
    input: EmployeeOnboardingInput,
    organizationId: string,
  ): Promise<void> {
    const c = input.contract;
    if (!c) return;

    const patch: Partial<EmployeeContract> = {};
    if (c.contractType !== undefined) patch.contractType = c.contractType;
    if (c.position !== undefined) patch.position = c.position ?? null;
    if (c.startDate !== undefined) patch.startDate = c.startDate;
    if (c.endDate !== undefined) patch.endDate = c.endDate ?? null;
    if (c.probationEndDate !== undefined)
      patch.probationEndDate = c.probationEndDate ?? null;
    if (c.workloadPercent !== undefined)
      patch.workloadPercent = c.workloadPercent ?? null;
    if (c.weeklyHours !== undefined) patch.weeklyHours = c.weeklyHours ?? null;
    if (c.annualVacationDays !== undefined)
      patch.annualVacationDays = c.annualVacationDays ?? null;
    if (c.grossSalary !== undefined) patch.grossSalary = c.grossSalary ?? null;
    if (c.hourlyRate !== undefined) patch.hourlyRate = c.hourlyRate ?? null;
    if (c.paymentInterval !== undefined)
      patch.paymentInterval = c.paymentInterval ?? null;
    if (c.has13thSalary !== undefined)
      patch.has13thSalary = c.has13thSalary ?? null;
    if (c.weekdayTimeWindows !== undefined)
      patch.weekdayTimeWindows = c.weekdayTimeWindows ?? null;
    if (c.weekdayWorkloads !== undefined)
      patch.weekdayWorkloads = c.weekdayWorkloads ?? null;
    if (c.documentUrl !== undefined) patch.documentUrl = c.documentUrl ?? null;

    // Exact clock times take precedence in the engine. Keep the two modes
    // mutually exclusive so a leftover share cannot override a cleared plan.
    applyExclusiveScheduleFields(patch);

    const existing = await this.findCurrentOnboardingContract(
      manager,
      employee.id,
      organizationId,
    );

    // Drafts keep in-place upserts — the first contract is still being built.
    // Active employees version on change so history stays intact.
    if (existing && employee.status === EmployeeStatus.ACTIVE) {
      await this.versionOnboardingContractIfChanged(
        manager,
        existing,
        patch,
        employee.id,
        organizationId,
      );
      return;
    }

    if (existing) {
      Object.assign(existing, patch);
      // Switching the contract type mid-draft must not leave values behind that
      // contradict the new type (e.g. a monthly salary on an hourly contract).
      clearHiddenContractFields(existing, existing.contractType);
      await manager.save(EmployeeContract, existing);
    } else if (patch.startDate) {
      // A contract row requires a start date; only create once we have one.
      const contract = manager.create(EmployeeContract, {
        ...patch,
        employeeId: employee.id,
        organizationId,
        startDate: patch.startDate,
        isActive: true,
        isArchived: false,
      });
      clearHiddenContractFields(contract, contract.contractType);
      await manager.save(EmployeeContract, contract);
    }
  }

  /**
   * Same priority as the employee overview card: valid today → last past →
   * soonest future. Soft-deleted rows (`isActive: false`) are ignored.
   */
  private async findCurrentOnboardingContract(
    manager: EntityManager,
    employeeId: string,
    organizationId: string,
  ): Promise<EmployeeContract | null> {
    const rows = await manager.find(EmployeeContract, {
      where: { employeeId, organizationId, isActive: true },
      order: { startDate: 'DESC' },
    });
    if (rows.length === 0) return null;

    const today = new Date().toISOString().split('T')[0];
    const valid = rows.find((c) => {
      const start = c.startDate?.slice(0, 10);
      if (!start || start > today) return false;
      const end = c.endDate?.slice(0, 10);
      return !end || end >= today;
    });
    if (valid) return valid;

    const past = rows.find((c) => {
      const start = c.startDate?.slice(0, 10);
      return Boolean(start && start <= today);
    });
    if (past) return past;

    return [...rows].sort((a, b) =>
      (a.startDate ?? '') > (b.startDate ?? '') ? 1 : -1,
    )[0];
  }

  /**
   * For ACTIVE employees edited via onboarding: if contract terms changed,
   * end the current row and insert a successor (same versioning model as the
   * contracts tab). No-op when nothing material changed — person/role edits
   * must still save without touching the contract history.
   */
  private async versionOnboardingContractIfChanged(
    manager: EntityManager,
    previous: EmployeeContract,
    patch: Partial<EmployeeContract>,
    employeeId: string,
    organizationId: string,
  ): Promise<void> {
    const merged: Partial<EmployeeContract> = {
      organizationId,
      employeeId,
      contractType: patch.contractType ?? previous.contractType,
      position:
        patch.position !== undefined ? patch.position : previous.position,
      startDate: patch.startDate ?? previous.startDate,
      endDate: patch.endDate !== undefined ? patch.endDate : previous.endDate,
      probationEndDate:
        patch.probationEndDate !== undefined
          ? patch.probationEndDate
          : previous.probationEndDate,
      workloadPercent:
        patch.workloadPercent !== undefined
          ? patch.workloadPercent
          : previous.workloadPercent,
      weeklyHours:
        patch.weeklyHours !== undefined
          ? patch.weeklyHours
          : previous.weeklyHours,
      annualVacationDays:
        patch.annualVacationDays !== undefined
          ? patch.annualVacationDays
          : previous.annualVacationDays,
      grossSalary:
        patch.grossSalary !== undefined
          ? patch.grossSalary
          : previous.grossSalary,
      hourlyRate:
        patch.hourlyRate !== undefined ? patch.hourlyRate : previous.hourlyRate,
      paymentInterval:
        patch.paymentInterval !== undefined
          ? patch.paymentInterval
          : previous.paymentInterval,
      has13thSalary:
        patch.has13thSalary !== undefined
          ? patch.has13thSalary
          : previous.has13thSalary,
      weekdayTimeWindows:
        patch.weekdayTimeWindows !== undefined
          ? patch.weekdayTimeWindows
          : previous.weekdayTimeWindows,
      weekdayWorkloads:
        patch.weekdayWorkloads !== undefined
          ? patch.weekdayWorkloads
          : previous.weekdayWorkloads,
      documentUrl:
        patch.documentUrl !== undefined
          ? patch.documentUrl
          : previous.documentUrl,
      supervisorMembershipId: previous.supervisorMembershipId,
      remainingVacationDays: previous.remainingVacationDays,
      notes: previous.notes,
    };

    applyExclusiveScheduleFields(merged);
    clearHiddenContractFields(merged, merged.contractType);

    // Compare against a type-cleared + schedule-normalized copy of the previous
    // row so leftover hidden fields, dual schedule modes, or null/false /
    // empty-schedule noise do not look like a material change.
    const previousComparable: Partial<EmployeeContract> = { ...previous };
    applyExclusiveScheduleFields(previousComparable);
    clearHiddenContractFields(
      previousComparable,
      previousComparable.contractType ?? merged.contractType,
    );

    // Edit wizard maps legacy position labels → function IDs; treat label and
    // matching function id as the same value so person-only saves stay quiet.
    await this.alignPositionForCompare(
      manager,
      previousComparable,
      merged,
      organizationId,
    );

    if (
      this.onboardingContractSnapshot(previousComparable) ===
      this.onboardingContractSnapshot(merged)
    ) {
      return;
    }

    let newStartDate = merged.startDate;
    if (!newStartDate) {
      throw new BadRequestException(
        'startDate is required to create a new contract version',
      );
    }
    // Same effective day cannot version (previous would end before it starts).
    // When terms changed but the form kept the old start date, take today.
    if (newStartDate <= previous.startDate) {
      const today = new Date().toISOString().split('T')[0];
      if (today <= previous.startDate) {
        throw new BadRequestException(
          'New contract startDate must be after the previous contract startDate',
        );
      }
      newStartDate = today;
      merged.startDate = today;
    }

    assertContractTypeFields(merged, merged.contractType);

    previous.endDate = this.dayBeforeIso(newStartDate);
    await manager.save(EmployeeContract, previous);

    const next = manager.create(EmployeeContract, {
      ...merged,
      startDate: newStartDate,
      previousContractId: previous.id,
      isActive: true,
      isArchived: false,
    });
    clearHiddenContractFields(next, next.contractType);
    await manager.save(EmployeeContract, next);
  }

  /** Comparable snapshot of contract fields relevant to onboarding edits. */
  private onboardingContractSnapshot(c: Partial<EmployeeContract>): string {
    const num = (v: unknown) => (v == null || v === '' ? null : Number(v));
    const str = (v: unknown) => {
      if (v == null) return null;
      if (typeof v === 'string') {
        const s = v.trim();
        return s === '' ? null : s;
      }
      if (typeof v === 'number' || typeof v === 'boolean') {
        return String(v);
      }
      return null;
    };
    return JSON.stringify({
      contractType: c.contractType ?? null,
      position: str(c.position),
      startDate: c.startDate ?? null,
      endDate: c.endDate ?? null,
      probationEndDate: c.probationEndDate ?? null,
      workloadPercent: num(c.workloadPercent),
      weeklyHours: str(c.weeklyHours),
      annualVacationDays: num(c.annualVacationDays),
      grossSalary: num(c.grossSalary),
      hourlyRate: num(c.hourlyRate),
      paymentInterval: c.paymentInterval ?? null,
      // Form defaults null → false; treat both as "no 13th salary".
      has13thSalary: c.has13thSalary === true,
      weekdayTimeWindows: this.normalizeScheduleSnapshot(c.weekdayTimeWindows),
      weekdayWorkloads: this.normalizeScheduleSnapshot(c.weekdayWorkloads),
      documentUrl: str(c.documentUrl),
    });
  }

  /**
   * Strip empty weekday keys / empty objects so `{}`, `{mon:null}` and `null`
   * compare equal, and numeric strings match numbers.
   */
  private normalizeScheduleSnapshot(value: unknown): unknown {
    if (value == null || typeof value !== 'object') return null;
    const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
    const out: Record<string, unknown> = {};
    let any = false;
    for (const key of keys) {
      const day = (value as Record<string, unknown>)[key];
      if (Array.isArray(day) && day.length > 0) {
        out[key] = day.map((window): { start: string; end: string } | null => {
          if (!window || typeof window !== 'object') return null;
          const w = window as { start?: string; end?: string };
          return { start: w.start ?? '', end: w.end ?? '' };
        });
        any = true;
      } else if (day != null && day !== '' && Number(day) > 0) {
        out[key] = Number(day);
        any = true;
      }
    }
    return any ? out : null;
  }

  /**
   * When previous stores a legacy function label and the form sends the
   * matching function UUID (or vice versa), rewrite the previous side so the
   * snapshot comparison does not treat that remapping as a contract change.
   */
  private async alignPositionForCompare(
    manager: EntityManager,
    previous: Partial<EmployeeContract>,
    merged: Partial<EmployeeContract>,
    organizationId: string,
  ): Promise<void> {
    const left =
      typeof previous.position === 'string' ? previous.position.trim() : '';
    const right =
      typeof merged.position === 'string' ? merged.position.trim() : '';
    if (!left || !right || left === right) return;

    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const resolve = async (value: string) => {
      if (uuidRe.test(value)) {
        return manager.findOne(EmployeeFunction, {
          where: { id: value, organizationId },
        });
      }
      return manager.findOne(EmployeeFunction, {
        where: { name: value, organizationId },
      });
    };

    const [prevFn, nextFn] = await Promise.all([resolve(left), resolve(right)]);
    if (prevFn && nextFn && prevFn.id === nextFn.id) {
      previous.position = merged.position;
      return;
    }
    if (prevFn && (prevFn.id === right || prevFn.name === right)) {
      previous.position = merged.position;
      return;
    }
    if (nextFn && (nextFn.id === left || nextFn.name === left)) {
      previous.position = merged.position;
    }
  }

  private dayBeforeIso(isoDate: string): string {
    const d = new Date(`${isoDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
  }

  /**
   * Finalizes a draft: verifies completeness (contract with start date + at
   * least one role), flips the status to ACTIVE and dispatches or schedules the
   * first-login invitation according to the chosen timing.
   */
  async finalizeEmployeeOnboarding(
    input: FinalizeEmployeeOnboardingInput,
    organizationId: string,
  ): Promise<Employee> {
    return this.entityManager.transaction(async (manager) => {
      await manager.findOneOrFail(Organization, {
        where: { id: organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      const locked = await manager.findOne(Employee, {
        where: { id: input.id, organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked || locked.organizationId !== organizationId)
        throw new NotFoundException('Employee not found');
      if (locked.status !== EmployeeStatus.DRAFT)
        throw new ConflictException('Employee is already finalized');
      if (locked.version !== input.expectedVersion)
        throw new ConflictException(
          'Employee was changed; reload before finalizing',
        );
      const employee = await manager.findOne(Employee, {
        where: { id: input.id, organizationId },
        relations: { membership: { roles: true } },
      });
      if (!employee || employee.membership?.organizationId !== organizationId) {
        throw new NotFoundException('Employee not found');
      }

      const contract = await manager.findOne(EmployeeContract, {
        where: { employeeId: employee.id, organizationId, isActive: true },
        order: { createdAt: 'DESC' },
      });
      if (!contract?.startDate) {
        throw new BadRequestException(
          'A contract with a start date is required before finalizing',
        );
      }
      // Drafts may stay incomplete while the wizard is open; the contract type's
      // required fields are only enforced when the employee goes live.
      assertContractTypeFields(contract, contract.contractType);
      if (!employee.membership.roles?.length) {
        throw new BadRequestException('At least one role is required');
      }

      employee.status = EmployeeStatus.ACTIVE;
      await manager.save(Employee, employee);

      if (input.invitationTiming === InvitationTiming.IMMEDIATE) {
        await this.invitationService.sendInvite(
          employee.id,
          organizationId,
          manager,
        );
      } else if (input.invitationTiming === InvitationTiming.ON_ENTRY_DATE) {
        const sendAt = new Date(`${contract.startDate}T02:00:00`);
        if (sendAt.getTime() <= Date.now()) {
          await this.invitationService.sendInvite(
            employee.id,
            organizationId,
            manager,
          );
        } else {
          await this.invitationService.scheduleInvite(
            employee.id,
            sendAt,
            manager,
          );
        }
      } else {
        // MANUAL: leave invitationStatus = PENDING for a later manual send.
        employee.invitationStatus = EmployeeInvitationStatus.PENDING;
        await manager.save(Employee, employee);
      }

      return manager.findOneOrFail(Employee, {
        where: { id: employee.id },
        relations: {
          membership: { user: true, organization: true, roles: true },
        },
      });
    });
  }

  /** Manually (re-)send the first-login invitation for an employee. */
  async sendEmployeeInvitation(
    employeeId: string,
    organizationId: string,
  ): Promise<Employee> {
    await this.invitationService.sendInvite(employeeId, organizationId);
    return this.findEmployeeById(employeeId, organizationId);
  }
}
