import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { ProjectsModule } from '@/project-management/projects/projects.module';
import { Module } from '@nestjs/common';
import { TemplatesResolver } from './templates.resolver';
import { TemplatesService } from './templates.service';

@Module({
  imports: [CommonModule, DatabaseModule, ProjectsModule],
  providers: [TemplatesResolver, TemplatesService],
})
export class TemplatesModule {}
