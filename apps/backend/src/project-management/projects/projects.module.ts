import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { Module } from '@nestjs/common';
import { ProjectAccessService } from './project-access.service';
import { ProjectsResolver } from './projects.resolver';
import { ProjectsService } from './projects.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [ProjectsResolver, ProjectsService, ProjectAccessService],
  // Exported so the project-members and tasks modules can enforce the same
  // visibility / authorization rules.
  exports: [ProjectAccessService],
})
export class ProjectsModule {}
