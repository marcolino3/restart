import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { VvtResolver } from './vvt.resolver';
import { VvtService } from './vvt.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [VvtResolver, VvtService],
  exports: [VvtService],
})
export class VvtModule {}
