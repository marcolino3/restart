import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { ContactPersonsService } from './contact-persons.service';
import { ContactPerson } from './entities/contact-person.entity';
import { StudentContactPerson } from './entities/student-contact-person.entity';
import { CreateContactPersonInput } from './dto/create-contact-person.input';
import { UpdateContactPersonInput } from './dto/update-contact-person.input';
import { LinkContactPersonInput } from './dto/link-contact-person.input';
import { UpdateStudentContactPersonInput } from './dto/update-student-contact-person.input';
import { AddressSuggestion } from './dto/address-suggestion.type';

@Resolver(() => ContactPerson)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ContactPersonsResolver {
  constructor(
    private readonly contactPersonsService: ContactPersonsService,
  ) {}

  @Query(() => [ContactPerson], { name: 'contactPersonsByOrgId' })
  @Permissions('CONTACT_PERSON_READ')
  findAll(@CurrentOrgId() orgId: string) {
    return this.contactPersonsService.findAllByOrgId(orgId);
  }

  @Query(() => ContactPerson, { name: 'contactPersonById' })
  @Permissions('CONTACT_PERSON_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.contactPersonsService.findOne(id, orgId);
  }

  @Query(() => [StudentContactPerson], { name: 'contactPersonsByStudentId' })
  @Permissions('CONTACT_PERSON_READ')
  findByStudentId(
    @Args('studentId', { type: () => ID }) studentId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.contactPersonsService.findByStudentId(studentId, orgId);
  }

  @Query(() => [StudentContactPerson], {
    name: 'studentsByContactPersonId',
  })
  @Permissions('CONTACT_PERSON_READ')
  findStudentsByContactPersonId(
    @Args('contactPersonId', { type: () => ID }) contactPersonId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.contactPersonsService.findStudentsByContactPersonId(
      contactPersonId,
      orgId,
    );
  }

  @Query(() => [ContactPerson], { name: 'contactPersonsSharingAddress' })
  @Permissions('CONTACT_PERSON_READ')
  findSharingAddress(
    @Args('addressId', { type: () => ID }) addressId: string,
    @Args('excludeContactPersonId', { type: () => ID })
    excludeContactPersonId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.contactPersonsService.findContactPersonsSharingAddress(
      addressId,
      excludeContactPersonId,
      orgId,
    );
  }

  @Query(() => [AddressSuggestion], {
    name: 'relatedAddressesForContactPerson',
  })
  @Permissions('CONTACT_PERSON_READ')
  findRelatedAddresses(
    @Args('contactPersonId', { type: () => ID }) contactPersonId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.contactPersonsService.findRelatedAddresses(
      contactPersonId,
      orgId,
    );
  }

  @Mutation(() => ContactPerson)
  @Permissions('CONTACT_PERSON_WRITE')
  createContactPerson(
    @Args('input') input: CreateContactPersonInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.contactPersonsService.create(input, orgId);
  }

  @Mutation(() => ContactPerson)
  @Permissions('CONTACT_PERSON_WRITE')
  updateContactPerson(
    @Args('input') input: UpdateContactPersonInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.contactPersonsService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('CONTACT_PERSON_DELETE')
  archiveContactPerson(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.contactPersonsService.archive(id, orgId);
  }

  @Mutation(() => StudentContactPerson)
  @Permissions('CONTACT_PERSON_WRITE')
  linkContactPersonToStudent(
    @Args('input') input: LinkContactPersonInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.contactPersonsService.linkToStudent(input, orgId);
  }

  @Mutation(() => StudentContactPerson)
  @Permissions('CONTACT_PERSON_WRITE')
  updateStudentContactPersonLink(
    @Args('input') input: UpdateStudentContactPersonInput,
    @CurrentOrgId() orgId: string,
  ) {
    const { id, ...patch } = input;
    return this.contactPersonsService.updateLink(id, patch, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('CONTACT_PERSON_WRITE')
  unlinkContactPersonFromStudent(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.contactPersonsService.unlink(id, orgId);
  }
}
