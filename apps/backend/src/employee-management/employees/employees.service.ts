import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { User } from '@/users/entities/user.entity';
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
    const { email, firstName, lastName, persona } = input;

    return this.entityManager.transaction(async (manager) => {
      // 1) Org prüfen
      const organization = await manager.findOne(Organization, {
        where: { id: currentOrganizationId },
      });
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      // 2) User prüfen (ggf. anlegen)
      const normalizedEmail = email.toLowerCase().trim();
      let user = await manager.findOne(User, {
        where: { email: normalizedEmail },
      });

      if (!user) {
        user = manager.create(User, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: normalizedEmail,
          passwordHash:
            await this.passwordService.generateRandomPasswordHash(10),
          isActive: true,
        });
        user = await manager.save(User, user);
      }

      // 3) Membership prüfen oder anlegen
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
          isActive: true,
          isArchived: false,
        });
        membership = await manager.save(Membership, membership);
      }

      // 4) Employee anlegen
      let employee = manager.create(Employee, {
        membership,
        timeTrackingEnabled: false,
        isActive: true,
        isArchived: false,
      });
      employee = await manager.save(Employee, employee);

      // 5) Membership mit employeeId aktualisieren
      membership.employeeId = employee.id;
      await manager.save(Membership, membership);

      // 6) Employee zurückgeben (mit Membership + Relationen falls nötig)
      return manager.findOneOrFail(Employee, {
        where: { id: employee.id },
        relations: {
          membership: { user: true, organization: true, roles: true },
        },
      });
    });
  }

  async updateEmployeeMinimal(
    input: UpdateEmployeeInput, // oder besser: UpdateEmployeeInput
  ): Promise<Employee> {
    const { id, email, firstName, lastName, persona } = input;

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
      const user = membership.user;

      // 2) User-Daten aktualisieren (falls geändert)
      let userChanged = false;

      if (user && firstName && user?.firstName !== firstName.trim()) {
        user.firstName = firstName.trim();
        userChanged = true;
      }

      if (user && lastName && user?.lastName !== lastName.trim()) {
        user.lastName = lastName.trim();
        userChanged = true;
      }

      if (user && email && user.email !== email.toLowerCase().trim()) {
        user.email = email.toLowerCase().trim();
        userChanged = true;
      }

      if (user && userChanged) {
        await manager.save(User, user);
      }

      // 3) Membership aktualisieren (Persona)
      if (persona && membership.persona !== persona) {
        membership.persona = persona;
        await manager.save(Membership, membership);
      }

      // 5) Employee mit geladenen Relationen zurückgeben
      return manager.findOneOrFail(Employee, {
        where: { id: employee.id },
        relations: {
          membership: { user: true, organization: true, roles: true },
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
          user: true,
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

  async findEmployeeById(employeeId: string, organizationId: string) {
    const membership = this.entityManager.findOne(Membership, {
      where: {
        organizationId,
        employeeId,
      },
      relations: ['employee', 'user'],
    });

    return membership;
  }
}
