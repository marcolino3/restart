import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { WorkTimeCalculationModule } from '../work-time-calculation/work-time-calculation.module';
import { HolidaysService } from './holidays.service';
import { HolidaysResolver } from './holidays.resolver';

@Module({
  imports: [DatabaseModule, WorkTimeCalculationModule],
  providers: [HolidaysResolver, HolidaysService],
  exports: [HolidaysService],
})
export class HolidaysModule {}
