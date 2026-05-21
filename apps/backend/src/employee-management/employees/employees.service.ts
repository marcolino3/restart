import { Persona } from '@/common/enums/persona.enum';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { User } from '@/users/entities/user.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateEmployeeInput } from './dto/create-employee.input';
import { UpdateEmployeeInput } from './dto/update-employee.input';
import { Employee } from './entities/employee.entity';
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
}
