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

@Injectable()
export class EmployeesService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly passwordService: PasswordService,

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

      // 2) User-Daten aktualisieren (falls geaendert)
      let userChanged = false;

      if (user && firstName !== undefined && user.firstName !== firstName.trim()) {
        user.firstName = firstName.trim();
        userChanged = true;
      }

      if (user && lastName !== undefined && user.lastName !== lastName.trim()) {
        user.lastName = lastName.trim();
        userChanged = true;
      }

      if (user && title !== undefined && user.title !== (title.trim() || null)) {
        user.title = title.trim() || null;
        userChanged = true;
      }

      if (user && dateOfBirth !== undefined) {
        user.dateOfBirth = dateOfBirth || null;
        userChanged = true;
      }

      if (user && socialSecurityNumber !== undefined) {
        user.socialSecurityNumber = socialSecurityNumber?.trim() || null;
        userChanged = true;
      }

      if (user && userChanged) {
        await manager.save(User, user);
      }

      // 3) Membership aktualisieren (Persona, ContactPhone)
      let membershipChanged = false;

      if (persona !== undefined && membership.persona !== persona) {
        membership.persona = persona;
        membershipChanged = true;
      }

      if (contactPhone !== undefined) {
        membership.contactPhone = contactPhone?.trim() || undefined;
        membershipChanged = true;
      }

      if (membershipChanged) {
        await manager.save(Membership, membership);
      }

      // 4) Employee aktualisieren (TimeTracking)
      if (timeTrackingEnabled !== undefined && employee.timeTrackingEnabled !== timeTrackingEnabled) {
        employee.timeTrackingEnabled = timeTrackingEnabled;
        await manager.save(Employee, employee);
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
