import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import { UseGuards } from '@nestjs/common';
import { Mutation, Resolver } from '@nestjs/graphql';
import { CalendarConnectionTestOutput } from './dto/calendar-connection-test.output';
import { GoogleCalendarService } from './google-calendar.service';

@Resolver(() => CalendarConnectionTestOutput)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class GoogleCalendarResolver {
  constructor(
    private readonly calendar: GoogleCalendarService,
    private readonly organizationSettings: OrganizationSettingsService,
  ) {}

  /**
   * Read-only probe of the org's calendar configuration — reads the target
   * calendar's metadata and creates nothing. The organization comes from the
   * token, so an admin can only ever test their own tenant.
   */
  @Mutation(() => CalendarConnectionTestOutput, {
    name: 'testCalendarConnection',
  })
  async testCalendarConnection(
    @CurrentUser() user: TokenPayload,
  ): Promise<CalendarConnectionTestOutput> {
    const organizationId = user.orgId as string;
    await this.organizationSettings.assertCanManageSettings(
      organizationId,
      user,
    );

    // Settings may have just been updated — drop the cached client so the test
    // reflects what was actually stored.
    this.calendar.invalidateCache(organizationId);

    const result = await this.calendar.testConnection(organizationId);
    return {
      ok: result.ok,
      calendarSummary: result.calendarSummary ?? null,
      error: result.error ?? null,
    };
  }
}
