import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { AdmissionAppointmentTypesResolver } from './admission-appointment-types.resolver';
import { AdmissionAppointmentTypesService } from './admission-appointment-types.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [
    AdmissionAppointmentTypesResolver,
    AdmissionAppointmentTypesService,
  ],
  exports: [AdmissionAppointmentTypesService],
})
export class AdmissionAppointmentTypesModule {}
