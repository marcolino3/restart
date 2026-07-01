import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { ProjectsModule } from '@/project-management/projects/projects.module';
import { Module } from '@nestjs/common';
import { TasksResolver } from './tasks.resolver';
import { TasksService } from './tasks.service';

@Module({
  imports: [CommonModule, DatabaseModule, ProjectsModule],
  providers: [TasksResolver, TasksService],
})
export class TasksModule {}
