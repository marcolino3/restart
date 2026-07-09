import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Not, Repository } from 'typeorm';
import { CreateContactPersonInput } from './dto/create-contact-person.input';
import { UpdateContactPersonInput } from './dto/update-contact-person.input';
import { AddressSuggestion } from './dto/address-suggestion.type';
import { ContactPerson } from './entities/contact-person.entity';
import { StudentContactPerson } from './entities/student-contact-person.entity';
import { Family } from '@/school-management/families/entities/family.entity';

@Injectable()
export class ContactPersonsService {
  constructor(
    @InjectRepository(ContactPerson)
    private readonly contactPersonRepo: Repository<ContactPerson>,
    private readonly entityManager: EntityManager,
  ) {}

  async findAllByOrgId(organizationId: string): Promise<ContactPerson[]> {
    const items = await this.contactPersonRepo.find({
      where: { organizationId, isArchived: false },
      relations: ['address', 'address.country'],
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
    return items.map((cp) => this.normalizeArrays(cp));
  }

  async findOne(id: string, organizationId: string): Promise<ContactPerson> {
    const contactPerson = await this.contactPersonRepo.findOne({
      where: { id, organizationId, isArchived: false },
      relations: ['address', 'address.country'],
    });
    if (!contactPerson) {
      throw new NotFoundException(`Contact person ${id} not found`);
    }
    return this.normalizeArrays(contactPerson);
  }

  private normalizeArrays(cp: ContactPerson): ContactPerson {
    cp.nationalities = cp.nationalities ?? [];
    cp.preferredLanguages = cp.preferredLanguages ?? [];
    cp.roles = cp.roles ?? [];
    return cp;
  }

  async findByStudentId(
    studentId: string,
    organizationId: string,
  ): Promise<StudentContactPerson[]> {
    return this.entityManager.find(StudentContactPerson, {
      where: { studentId, organizationId, isArchived: false },
      relations: [
        'contactPerson',
        'contactPerson.address',
        'contactPerson.address.country',
      ],
      order: {
        isPrimaryContact: 'DESC',
        emergencyPriority: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  async findStudentsByContactPersonId(
    contactPersonId: string,
    organizationId: string,
  ): Promise<StudentContactPerson[]> {
    return this.entityManager.find(StudentContactPerson, {
      where: { contactPersonId, organizationId, isArchived: false },
      relations: ['student'],
      order: { createdAt: 'ASC' },
    });
  }

  async create(
    input: CreateContactPersonInput,
    organizationId: string,
  ): Promise<ContactPerson> {
    const { links, ...rest } = input;
    await this.assertFamilyInOrg(rest.familyId, organizationId);

    return this.entityManager.transaction(async (manager) => {
      const contactPerson = manager.create(ContactPerson, {
        ...rest,
        nationalities: rest.nationalities ?? [],
        preferredLanguages: rest.preferredLanguages ?? [],
        roles: rest.roles ?? [],
        organizationId,
      });
      const saved = await manager.save(contactPerson);

      if (links && links.length > 0) {
        for (const link of links) {
          await this.createLink(manager, link, organizationId);
        }
      }

      const reloaded = await manager.findOne(ContactPerson, {
        where: { id: saved.id, organizationId },
        relations: ['address', 'address.country'],
      });
      if (!reloaded) {
        throw new NotFoundException(
          `Contact person ${saved.id} not found after create`,
        );
      }
      return reloaded;
    });
  }

  async update(
    input: UpdateContactPersonInput,
    organizationId: string,
  ): Promise<ContactPerson> {
    const { id: _id, ...rest } = input;
    await this.assertFamilyInOrg(rest.familyId, organizationId);
    // Load WITHOUT the `address` relation so an assigned `addressId` wins on
    // save (a loaded relation object would silently revert the FK change).
    // Stays org-scoped for multi-tenant isolation.
    const contactPerson = await this.contactPersonRepo.findOne({
      where: { id: input.id, organizationId, isArchived: false },
    });
    if (!contactPerson) {
      throw new NotFoundException(`Contact person ${input.id} not found`);
    }
    Object.assign(contactPerson, rest);
    await this.contactPersonRepo.save(contactPerson);
    return this.findOne(input.id, organizationId);
  }

  /** Multi-tenant guard: a familyId may only reference a family of the active org. */
  private async assertFamilyInOrg(
    familyId: string | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!familyId) return;
    const family = await this.entityManager.findOne(Family, {
      where: { id: familyId, organizationId },
    });
    if (!family) {
      throw new NotFoundException(`Family ${familyId} not found`);
    }
  }

  async archive(id: string, organizationId: string): Promise<boolean> {
    const contactPerson = await this.findOne(id, organizationId);
    contactPerson.isArchived = true;
    await this.contactPersonRepo.save(contactPerson);
    return true;
  }

  async linkToStudent(
    input: {
      studentId: string;
      contactPersonId: string;
      relationshipType: any;
      isPrimaryContact?: boolean;
      hasCustody?: boolean;
      isPickupAuthorized?: boolean;
      emergencyPriority?: number;
      livesWithStudent?: boolean;
      notes?: string;
    },
    organizationId: string,
  ): Promise<StudentContactPerson> {
    return this.entityManager.transaction((manager) =>
      this.createLink(manager, input, organizationId),
    );
  }

  async updateLink(
    id: string,
    patch: {
      relationshipType?: any;
      isPrimaryContact?: boolean;
      hasCustody?: boolean;
      isPickupAuthorized?: boolean;
      emergencyPriority?: number;
      livesWithStudent?: boolean;
      notes?: string;
    },
    organizationId: string,
  ): Promise<StudentContactPerson> {
    return this.entityManager.transaction(async (manager) => {
      const link = await manager.findOne(StudentContactPerson, {
        where: { id, organizationId, isArchived: false },
      });
      if (!link) {
        throw new NotFoundException(
          `Student-contact-person link ${id} not found`,
        );
      }

      if (patch.isPrimaryContact === true && !link.isPrimaryContact) {
        await this.clearPrimaryContact(manager, link.studentId, organizationId);
      }

      Object.assign(link, patch);
      await manager.save(link);

      const reloaded = await manager.findOne(StudentContactPerson, {
        where: { id },
        relations: ['contactPerson', 'contactPerson.address', 'student'],
      });
      return reloaded!;
    });
  }

  async unlink(id: string, organizationId: string): Promise<boolean> {
    const link = await this.entityManager.findOne(StudentContactPerson, {
      where: { id, organizationId },
    });
    if (!link) {
      throw new NotFoundException(
        `Student-contact-person link ${id} not found`,
      );
    }
    link.isArchived = true;
    link.isPrimaryContact = false;
    await this.entityManager.save(link);
    return true;
  }

  private async createLink(
    manager: EntityManager,
    input: {
      studentId: string;
      contactPersonId: string;
      relationshipType: any;
      isPrimaryContact?: boolean;
      hasCustody?: boolean;
      isPickupAuthorized?: boolean;
      emergencyPriority?: number;
      livesWithStudent?: boolean;
      notes?: string;
    },
    organizationId: string,
  ): Promise<StudentContactPerson> {
    const existing = await manager.findOne(StudentContactPerson, {
      where: {
        studentId: input.studentId,
        contactPersonId: input.contactPersonId,
        relationshipType: input.relationshipType,
        organizationId,
      },
    });
    if (existing && !existing.isArchived) {
      throw new ConflictException(
        'This contact person is already linked to the student with the same relationship',
      );
    }

    if (input.isPrimaryContact) {
      await this.clearPrimaryContact(manager, input.studentId, organizationId);
    }

    const link =
      existing ??
      manager.create(StudentContactPerson, {
        studentId: input.studentId,
        contactPersonId: input.contactPersonId,
        relationshipType: input.relationshipType,
        organizationId,
      });
    link.isArchived = false;
    link.relationshipType = input.relationshipType;
    link.isPrimaryContact = input.isPrimaryContact ?? false;
    link.hasCustody = input.hasCustody ?? false;
    link.isPickupAuthorized = input.isPickupAuthorized ?? true;
    link.emergencyPriority = input.emergencyPriority ?? null;
    link.livesWithStudent = input.livesWithStudent ?? false;
    link.notes = input.notes ?? null;

    const saved = await manager.save(link);
    const reloaded = await manager.findOne(StudentContactPerson, {
      where: { id: saved.id },
      relations: ['contactPerson', 'contactPerson.address', 'student'],
    });
    return reloaded!;
  }

  async findContactPersonsSharingAddress(
    addressId: string,
    excludeContactPersonId: string,
    organizationId: string,
  ): Promise<ContactPerson[]> {
    return this.contactPersonRepo.find({
      where: {
        addressId,
        organizationId,
        isArchived: false,
        id: Not(excludeContactPersonId),
      },
    });
  }

  async findRelatedAddresses(
    contactPersonId: string,
    organizationId: string,
  ): Promise<AddressSuggestion[]> {
    // 1. Find students linked to this contact person
    const studentLinks = await this.entityManager.find(StudentContactPerson, {
      where: { contactPersonId, organizationId, isArchived: false },
      relations: ['student'],
    });

    if (studentLinks.length === 0) return [];

    const studentIds = studentLinks.map((l) => l.studentId);

    // 2. Find all other contact persons linked to those students (with addresses)
    const otherLinks = await this.entityManager
      .createQueryBuilder(StudentContactPerson, 'scp')
      .innerJoinAndSelect('scp.contactPerson', 'cp')
      .innerJoinAndSelect('cp.address', 'addr')
      .leftJoinAndSelect('addr.country', 'country')
      .innerJoinAndSelect('scp.student', 'student')
      .where('scp.student_id IN (:...studentIds)', { studentIds })
      .andWhere('scp.contact_person_id != :cpId', { cpId: contactPersonId })
      .andWhere('scp.organization_id = :orgId', { orgId: organizationId })
      .andWhere('scp."isArchived" = false')
      .andWhere('cp."isArchived" = false')
      .andWhere('addr."isArchived" = false')
      .getMany();

    // 3. Deduplicate by addressId
    const seen = new Set<string>();
    const suggestions: AddressSuggestion[] = [];

    for (const link of otherLinks) {
      const addrId = link.contactPerson.addressId;
      if (!addrId || seen.has(addrId)) continue;
      seen.add(addrId);

      const suggestion = new AddressSuggestion();
      suggestion.address = link.contactPerson.address!;
      suggestion.contactPersonName = `${link.contactPerson.firstName} ${link.contactPerson.lastName}`;
      suggestion.relationshipType = link.relationshipType;
      suggestion.studentName = `${link.student.firstName} ${link.student.lastName}`;
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  private async clearPrimaryContact(
    manager: EntityManager,
    studentId: string,
    organizationId: string,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(StudentContactPerson)
      .set({ isPrimaryContact: false })
      .where('student_id = :studentId', { studentId })
      .andWhere('organization_id = :orgId', { orgId: organizationId })
      .andWhere('is_primary_contact = true')
      .andWhere('"isArchived" = false')
      .execute();
  }
}
