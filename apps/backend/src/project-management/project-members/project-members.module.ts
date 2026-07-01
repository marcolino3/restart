import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { ProjectsModule } from '@/project-management/projects/projects.module';
import { Module } from '@nestjs/common';
import { ProjectMembersResolver } from './project-members.resolver';
import { ProjectMembersService } from './project-members.service';

@Module({
  imports: [CommonModule, DatabaseModule, ProjectsModule],
  providers: [ProjectMembersResolver, ProjectMembersService],
})
export class ProjectMembersModule {}
