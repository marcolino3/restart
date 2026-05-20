import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AdmissionRemindersService } from './admission-reminders.service';
import { CreateAdmissionReminderInput } from './dto/create-admission-reminder.input';
import { UpdateAdmissionReminderInput } from './dto/update-admission-reminder.input';
import { AdmissionReminder } from './entities/admission-reminder.entity';
import { AdmissionReminderFilter } from './enums/admission-reminder-filter.enum';

@Resolver(() => AdmissionReminder)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AdmissionRemindersResolver {
  constructor(private readonly reminders: AdmissionRemindersService) {}

  @Query(() => [AdmissionReminder], { name: 'admissionReminders' })
  @Permissions('ADMISSION_APPLICATION_READ')
  findByApplication(
    @Args('applicationId', { type: () => ID }) applicationId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.reminders.findByApplication(applicationId, orgId);
  }

  @Query(() => [AdmissionReminder], { name: 'orgAdmissionReminders' })
  @Permissions('ADMISSION_APPLICATION_READ')
  findForOrg(
    @CurrentOrgId() orgId: string,
    @Args('filter', { type: () => AdmissionReminderFilter, nullable: true })
    filter?: AdmissionReminderFilter,
  ) {
    return this.reminders.findForOrg(
      orgId,
      filter ?? AdmissionReminderFilter.OPEN,
    );
  }

  @Mutation(() => AdmissionReminder)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  createAdmissionReminder(
    @Args('input') input: CreateAdmissionReminderInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() membershipId: string | null,
  ) {
    return this.reminders.create(input, orgId, membershipId);
  }

  @Mutation(() => AdmissionReminder)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  updateAdmissionReminder(
    @Args('input') input: UpdateAdmissionReminderInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.reminders.update(input, orgId);
  }

  @Mutation(() => AdmissionReminder)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  completeAdmissionReminder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() membershipId: string | null,
  ) {
    return this.reminders.complete(id, orgId, membershipId);
  }

  @Mutation(() => AdmissionReminder)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  uncompleteAdmissionReminder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.reminders.uncomplete(id, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  deleteAdmissionReminder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.reminders.remove(id, orgId);
  }
}
