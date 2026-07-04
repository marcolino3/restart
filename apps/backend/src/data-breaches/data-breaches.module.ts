import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { DataBreachesResolver } from './data-breaches.resolver';
import { DataBreachesService } from './data-breaches.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [DataBreachesResolver, DataBreachesService],
  exports: [DataBreachesService],
})
export class DataBreachesModule {}
