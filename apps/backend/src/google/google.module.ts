import { Module } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { GeocodingService } from './geocoding.service';

@Module({
  providers: [GoogleCalendarService, GeocodingService],
  exports: [GoogleCalendarService, GeocodingService],
})
export class GoogleModule {}
