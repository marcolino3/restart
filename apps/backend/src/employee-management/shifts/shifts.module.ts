import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { ShiftsService } from './shifts.service';
import { ShiftsResolver } from './shifts.resolver';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [ShiftsResolver, ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}
