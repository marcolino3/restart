import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { DataExportResolver } from './data-export.resolver';
import { DataExportService } from './data-export.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [DataExportResolver, DataExportService],
  exports: [DataExportService],
})
export class DataExportModule {}
