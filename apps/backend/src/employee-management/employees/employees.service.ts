import { Persona } from '@/common/enums/persona.enum';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { TeamMember } from '@/employee-management/team-members/entities/team-member.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Role } from '@/roles/entities/role.entity';
import { User } from '@/users/entities/user.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
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
import {
  AuditLogChange,
  EmployeeAuditLogService,
} from '../employee-audit-log/employee-audit-log.service';
import { EmployeeAuditLogEntityType } from '../employee-audit-log/entities/employee-audit-log.entity';

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
    currentOrganizationId: string,
  ): Promise<Employee> {
    const {
      email,
      firstName,
      lastName,
      persona,
      title,
      dateOfBirth,
      socialSecurityNumber,
      contactPhone,
      timeTrackingEnabled,
      street,
      houseNumber,
      addressLine2,
      postalCode,
      city,
      country,
    } = input;

    return this.entityManager.transaction(async (manager) => {
      // 1) Org pruefen
      const organization = await manager.findOne(Organization, {
        where: { id: currentOrganizationId },
      });
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      // 2) User pruefen via UserEmail (ggf. anlegen)
      const normalizedEmail = email.toLowerCase().trim();
      let userEmail = await manager.findOne(UserEmail, {
        where: { email: normalizedEmail },
      });

      let user: User;
      if (userEmail) {
        const existingUser = await manager.findOneBy(User, {
          id: userEmail.userId,
        });
        if (!existingUser) {
          throw new NotFoundException('User for email not found');
        }
        user = existingUser;
      } else {
        // Neuen User + UserEmail anlegen
        user = manager.create(User, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          title: title?.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
          socialSecurityNumber: socialSecurityNumber?.trim() || undefined,
          street: street?.trim() || undefined,
          houseNumber: houseNumber?.trim() || undefined,
          addressLine2: addressLine2?.trim() || undefined,
          postalCode: postalCode?.trim() || undefined,
          city: city?.trim() || undefined,
          country: country?.trim() || undefined,
          isActive: true,
        });
        user = await manager.save(User, user);

        userEmail = manager.create(UserEmail, {
          userId: user.id,
          email: normalizedEmail,
          passwordHash:
            await this.passwordService.generateRandomPasswordHash(10),
          isPrimary: true,
          isVerified: false,
        });
        await manager.save(UserEmail, userEmail);
      }

      // 3) Membership pruefen oder anlegen
      let membership = await manager.findOne(Membership, {
        where: {
          organizationId: organization.id,
          userId: user.id,
        },
      });

      if (membership?.employeeId) {
        throw new ConflictException(
          'Employee already exists for this membership',
        );
      }

      if (!membership) {
        membership = manager.create(Membership, {
          organizationId: organization.id,
          userId: user.id,
          persona,
          userEmailId: userEmail.id,
          contactPhone: contactPhone?.trim() || undefined,
          isActive: true,
          isArchived: false,
        });
        membership = await manager.save(Membership, membership);
      }

      // 4) Employee anlegen
      let employee = manager.create(Employee, {
        membership,
        timeTrackingEnabled: timeTrackingEnabled ?? false,
        isActive: true,
        isArchived: false,
      });
      employee = await manager.save(Employee, employee);

      // 5) Membership mit employeeId aktualisieren
      membership.employeeId = employee.id;
      await manager.save(Membership, membership);

      // 6) Employee zurueckgeben
      return manager.findOneOrFail(Employee, {
        where: { id: employee.id },
        relations: {
          membership: { user: true, organization: true, roles: true },
        },
      });
    });
  }

  async updateEmployeeMinimal(
    input: UpdateEmployeeInput,
    organizationId: string,
    actorMembershipId?: string | null,
  ): Promise<Employee> {
    const {
      id,
      firstName,
      lastName,
      persona,
      title,
      dateOfBirth,
      socialSecurityNumber,
      contactPhone,
      timeTrackingEnabled,
      street,
      houseNumber,
      addressLine2,
      postalCode,
      city,
      country,
    } = input;

    return this.entityManager.transaction(async (manager) => {
      // 1) Employee laden (inkl. Membership + User)
      const employee = await manager.findOne(Employee, {
        where: { id },
        relations: {
          membership: { user: true, organization: true },
        },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      const membership = employee.membership;

      // Org-Isolation pruefen
      if (membership.organizationId !== organizationId) {
        throw new NotFoundException('Employee not found');
      }

      const user = membership.user;
      const changes: AuditLogChange[] = [];

      const trackUser = (
        field: keyof User,
        next: string | null | undefined,
      ) => {
        if (!user) return;
        const normalized = next?.trim() || null;
        const current = (user[field] as string | null | undefined) ?? null;
        if (current !== normalized) {
          changes.push({
            entityType: EmployeeAuditLogEntityType.USER,
            fieldName: field,
            oldValue: current,
            newValue: normalized,
          });
          (user[field] as unknown) = normalized;
        }
      };

      // 2) User-Daten aktualisieren (falls geaendert)
      if (firstName !== undefined) trackUser('firstName', firstName);
      if (lastName !== undefined) trackUser('lastName', lastName);
      if (title !== undefined) trackUser('title', title);
      if (dateOfBirth !== undefined) trackUser('dateOfBirth', dateOfBirth);
      if (socialSecurityNumber !== undefined)
        trackUser('socialSecurityNumber', socialSecurityNumber);
      if (street !== undefined) trackUser('street', street);
      if (houseNumber !== undefined) trackUser('houseNumber', houseNumber);
      if (addressLine2 !== undefined) trackUser('addressLine2', addressLine2);
      if (postalCode !== undefined) trackUser('postalCode', postalCode);
      if (city !== undefined) trackUser('city', city);
      if (country !== undefined) trackUser('country', country);

      if (
        user &&
        changes.some((c) => c.entityType === EmployeeAuditLogEntityType.USER)
      ) {
        await manager.save(User, user);
      }

      // 3) Membership aktualisieren (Persona, ContactPhone)
      if (persona !== undefined && membership.persona !== persona) {
        changes.push({
          entityType: EmployeeAuditLogEntityType.MEMBERSHIP,
          fieldName: 'persona',
          oldValue: membership.persona,
          newValue: persona,
        });
        membership.persona = persona;
      }

      if (contactPhone !== undefined) {
        const next = contactPhone?.trim() || null;
        const current = membership.contactPhone ?? null;
        if (current !== next) {
          changes.push({
            entityType: EmployeeAuditLogEntityType.MEMBERSHIP,
            fieldName: 'contactPhone',
            oldValue: current,
            newValue: next,
          });
          membership.contactPhone = next ?? undefined;
        }
      }

      if (
        changes.some(
          (c) => c.entityType === EmployeeAuditLogEntityType.MEMBERSHIP,
        )
      ) {
        await manager.save(Membership, membership);
      }

      // 4) Employee aktualisieren (TimeTracking)
      if (
        timeTrackingEnabled !== undefined &&
        employee.timeTrackingEnabled !== timeTrackingEnabled
      ) {
        changes.push({
          entityType: EmployeeAuditLogEntityType.EMPLOYEE,
          fieldName: 'timeTrackingEnabled',
          oldValue: String(employee.timeTrackingEnabled),
          newValue: String(timeTrackingEnabled),
        });
        employee.timeTrackingEnabled = timeTrackingEnabled;
        await manager.save(Employee, employee);
      }

      // 5) Audit-Log schreiben
      if (changes.length > 0) {
        await this.auditLogService.logChanges(
          employee.id,
          organizationId,
          actorMembershipId ?? null,
          changes,
          manager,
        );
      }

      // 5) Employee mit geladenen Relationen zurueckgeben
      return manager.findOneOrFail(Employee, {
        where: { id: employee.id },
        relations: {
          membership: {
            user: { userEmails: true },
            organization: true,
            roles: true,
          },
        },
      });
    });
  }

  async findEmployeesByOrgId(organizationId: string) {
    const employees = await this.employeesService.find({
      relations: {
        membership: {
          organization: true,
          employee: true,
          user: { userEmails: true },
        },
        teamMembers: {
          team: true,
        },
      },
      where: {
        membership: {
          organizationId,
        },
      },
    });

    if (!employees)
      throw new InternalServerErrorException('Load Employees failed');

    return employees;
  }

  async findTeachersByOrgId(organizationId: string) {
    return this.employeesService.find({
      relations: {
        membership: {
          user: true,
        },
      },
      where: {
        isActive: true,
        membership: {
          organizationId,
          persona: Persona.TEACHER,
          isActive: true,
        },
      },
    });
  }

  async findEmployeeById(
    employeeId: string,
    organizationId: string,
  ): Promise<Employee> {
    const employee = await this.employeesService.findOne({
      where: { id: employeeId },
      relations: {
        membership: {
          user: { userEmails: true },
          organization: true,
          roles: true,
          userEmail: true,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Org-Isolation pruefen
    if (employee.membership?.organizationId !== organizationId) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  /**
   * Auto-saving upsert for the onboarding wizard. Without `id` a new DRAFT
   * employee (User + UserEmail + Membership + Employee) is created; with `id`
   * the existing draft is patched. Roles, team and the contract are applied in
   * the same transaction, each validated against the caller's organization
   * (multi-tenant isolation). Only fields that are present in the input are
   * touched, so each wizard step can save its own slice.
   */
  async upsertEmployeeOnboardingDraft(
    input: EmployeeOnboardingInput,
    organizationId: string,
  ): Promise<Employee> {
    return this.entityManager.transaction(async (manager) => {
      const organization = await manager.findOne(Organization, {
        where: { id: organizationId },
      });
      if (!organization) throw new NotFoundException('Organization not found');

      let employee: Employee;
      let membership: Membership;

      if (input.id) {
        const existing = await manager.findOne(Employee, {
          where: { id: input.id },
          relations: { membership: { user: true } },
        });
        if (
          !existing ||
          existing.membership?.organizationId !== organizationId
        ) {
          throw new NotFoundException('Employee not found');
        }
        employee = existing;
        membership = existing.membership;
        const user = membership.user;

        // Patch person fields (only provided ones).
        if (user) {
          this.assignIfPresent(user, {
            firstName: input.firstName?.trim(),
            lastName: input.lastName?.trim(),
            title: input.title,
            dateOfBirth: input.dateOfBirth,
            socialSecurityNumber: input.socialSecurityNumber,
            privateEmail: input.privateEmail,
            street: input.street,
            houseNumber: input.houseNumber,
            addressLine2: input.addressLine2,
            postalCode: input.postalCode,
            city: input.city,
            country: input.country,
            avatarUrl: input.avatarUrl,
            language: input.language,
          });
          await manager.save(User, user);
        }

        if (input.persona !== undefined) membership.persona = input.persona;
        if (input.contactPhone !== undefined)
          membership.contactPhone = input.contactPhone?.trim() || undefined;
        if (input.contactPhone2 !== undefined)
          membership.contactPhone2 = input.contactPhone2?.trim() || undefined;
        if (input.language !== undefined) membership.language = input.language;
        await manager.save(Membership, membership);

        if (input.timeTrackingEnabled !== undefined) {
          employee.timeTrackingEnabled = input.timeTrackingEnabled;
          await manager.save(Employee, employee);
        }
      } else {
        const email = input.email?.toLowerCase().trim();
        if (!email) {
          throw new BadRequestException('E-mail is required to start a draft');
        }
        let userEmail = await manager.findOne(UserEmail, {
          where: { email },
        });
        let user: User;
        if (userEmail) {
          const existingUser = await manager.findOneBy(User, {
            id: userEmail.userId,
          });
          if (!existingUser) {
            throw new NotFoundException('User for email not found');
          }
          user = existingUser;
        } else {
          user = manager.create(User, {
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            title: input.title?.trim() || undefined,
            dateOfBirth: input.dateOfBirth || undefined,
            socialSecurityNumber:
              input.socialSecurityNumber?.trim() || undefined,
            privateEmail: input.privateEmail?.trim() || undefined,
            street: input.street?.trim() || undefined,
            houseNumber: input.houseNumber?.trim() || undefined,
            addressLine2: input.addressLine2?.trim() || undefined,
            postalCode: input.postalCode?.trim() || undefined,
            city: input.city?.trim() || undefined,
            country: input.country?.trim() || undefined,
            avatarUrl: input.avatarUrl?.trim() || undefined,
            language: input.language || undefined,
            isActive: true,
          });
          user = await manager.save(User, user);

          userEmail = manager.create(UserEmail, {
            userId: user.id,
            email,
            passwordHash:
              await this.passwordService.generateRandomPasswordHash(10),
            isPrimary: true,
            isVerified: false,
          });
          await manager.save(UserEmail, userEmail);
        }

        const existingMembership = await manager.findOne(Membership, {
          where: { organizationId, userId: user.id },
        });
        if (existingMembership?.employeeId) {
          throw new ConflictException(
            'Employee already exists for this membership',
          );
        }
        membership =
          existingMembership ??
          manager.create(Membership, {
            organizationId,
            userId: user.id,
            persona: input.persona ?? Persona.EMPLOYEE,
            userEmailId: userEmail.id,
            contactPhone: input.contactPhone?.trim() || undefined,
            contactPhone2: input.contactPhone2?.trim() || undefined,
            language: input.language || undefined,
            isActive: true,
            isArchived: false,
          });
        membership = await manager.save(Membership, membership);

        employee = manager.create(Employee, {
          membership,
          status: EmployeeStatus.DRAFT,
          timeTrackingEnabled: input.timeTrackingEnabled ?? false,
          isActive: true,
          isArchived: false,
        });
        employee = await manager.save(Employee, employee);
        membership.employeeId = employee.id;
        await manager.save(Membership, membership);
      }

      await this.applyOnboardingRoles(
        manager,
        membership,
        input,
        organizationId,
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

  /** Assigns only defined values from `patch` onto `target`. */
  private assignIfPresent<T extends object>(
    target: T,
    patch: Partial<Record<keyof T, unknown>>,
  ): void {
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) {
        (target as Record<string, unknown>)[key] =
          typeof value === 'string' ? value.trim() || null : value;
      }
    }
  }

  private async applyOnboardingRoles(
    manager: EntityManager,
    membership: Membership,
    input: EmployeeOnboardingInput,
    organizationId: string,
  ): Promise<void> {
    if (input.roleIds === undefined) return;
    const roles = input.roleIds.length
      ? await manager.find(Role, {
          where: { id: In(input.roleIds), organizationId },
        })
      : [];
    if (roles.length !== input.roleIds.length) {
      throw new BadRequestException(
        'One or more roles do not belong to this organization',
      );
    }
    membership.roles = roles;
    await manager.save(Membership, membership);
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
    if (c.workloadPercent !== undefined)
      patch.workloadPercent = c.workloadPercent ?? null;
    if (c.weeklyHours !== undefined) patch.weeklyHours = c.weeklyHours ?? null;
    if (c.annualVacationDays !== undefined)
      patch.annualVacationDays = c.annualVacationDays ?? null;
    if (c.weekdayTimeWindows !== undefined)
      patch.weekdayTimeWindows = c.weekdayTimeWindows ?? null;
    if (c.documentUrl !== undefined) patch.documentUrl = c.documentUrl ?? null;

    let contract = await manager.findOne(EmployeeContract, {
      where: { employeeId: employee.id, organizationId, isActive: true },
      order: { createdAt: 'DESC' },
    });
    if (contract) {
      Object.assign(contract, patch);
      await manager.save(EmployeeContract, contract);
    } else if (patch.startDate) {
      // A contract row requires a start date; only create once we have one.
      contract = manager.create(EmployeeContract, {
        ...patch,
        employeeId: employee.id,
        organizationId,
        startDate: patch.startDate,
        isActive: true,
        isArchived: false,
      });
      await manager.save(EmployeeContract, contract);
    }
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
      const employee = await manager.findOne(Employee, {
        where: { id: input.id },
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
