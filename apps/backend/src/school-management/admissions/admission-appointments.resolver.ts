import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AdmissionAppointmentsService } from './admission-appointments.service';
import { CreateAdmissionAppointmentInput } from './dto/create-admission-appointment.input';
import { UpdateAdmissionAppointmentInput } from './dto/update-admission-appointment.input';
import { AdmissionAppointment } from './entities/admission-appointment.entity';

@Resolver(() => AdmissionAppointment)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AdmissionAppointmentsResolver {
  constructor(private readonly appointments: AdmissionAppointmentsService) {}

  @Query(() => [AdmissionAppointment], {
    name: 'admissionAppointmentsByApplication',
  })
  @Permissions('ADMISSION_APPLICATION_READ')
  findByApplication(
    @Args('applicationId', { type: () => ID }) applicationId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.appointments.findByApplication(applicationId, orgId);
  }

  @Mutation(() => AdmissionAppointment)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  createAdmissionAppointment(
    @Args('input') input: CreateAdmissionAppointmentInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() membershipId: string | null,
  ) {
    return this.appointments.create(input, orgId, membershipId);
  }

  @Mutation(() => AdmissionAppointment)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  updateAdmissionAppointment(
    @Args('input') input: UpdateAdmissionAppointmentInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.appointments.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  deleteAdmissionAppointment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.appointments.remove(id, orgId);
  }
}
