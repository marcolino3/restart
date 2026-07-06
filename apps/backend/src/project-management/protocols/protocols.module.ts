import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { ProjectsModule } from '@/project-management/projects/projects.module';
import { Module } from '@nestjs/common';
import { ProtocolTemplatesResolver } from './protocol-templates.resolver';
import { ProtocolTemplatesService } from './protocol-templates.service';
import { ProtocolsResolver } from './protocols.resolver';
import { ProtocolsService } from './protocols.service';

@Module({
  imports: [CommonModule, DatabaseModule, ProjectsModule],
  providers: [
    ProtocolsResolver,
    ProtocolsService,
    ProtocolTemplatesResolver,
    ProtocolTemplatesService,
  ],
})
export class ProtocolsModule {}
