import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { SchoolClassesResolver } from './school-classes.resolver';
import { SchoolClassesService } from './school-classes.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [SchoolClassesResolver, SchoolClassesService],
  exports: [SchoolClassesService],
})
export class SchoolClassesModule {}
