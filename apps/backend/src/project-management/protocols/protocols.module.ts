import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { ProjectsModule } from '@/project-management/projects/projects.module';
import { Module } from '@nestjs/common';
import { ProtocolsResolver } from './protocols.resolver';
import { ProtocolsService } from './protocols.service';

@Module({
  imports: [CommonModule, DatabaseModule, ProjectsModule],
  providers: [ProtocolsResolver, ProtocolsService],
})
export class ProtocolsModule {}
