import { Module } from '@nestjs/common';
import { ProjectMembersModule } from './project-members/project-members.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [ProjectsModule, ProjectMembersModule, TasksModule],
})
export class ProjectManagementModule {}
