import { Module } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCalendarResolver } from './google-calendar.resolver';
import { GeocodingService } from './geocoding.service';
import { OrganizationSettingsModule } from '@/organization-settings/organization-settings.module';

@Module({
  imports: [OrganizationSettingsModule],
  providers: [GoogleCalendarResolver, GoogleCalendarService, GeocodingService],
  exports: [GoogleCalendarService, GeocodingService],
})
export class GoogleModule {}
