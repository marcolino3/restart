import { Module } from '@nestjs/common';
import { ProjectMembersModule } from './project-members/project-members.module';
import { ProjectsModule } from './projects/projects.module';
import { ProtocolsModule } from './protocols/protocols.module';
import { TasksModule } from './tasks/tasks.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [
    ProjectsModule,
    ProjectMembersModule,
    TasksModule,
    TemplatesModule,
    ProtocolsModule,
  ],
})
export class ProjectManagementModule {}
