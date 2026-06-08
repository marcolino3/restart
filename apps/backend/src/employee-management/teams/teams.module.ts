import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsResolver } from './teams.resolver';
import { TeamAccessService } from './team-access.service';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [TeamsResolver, TeamsService, TeamAccessService],
  // Exported so timesheet/absence modules can scope access by team hierarchy.
  exports: [TeamAccessService],
})
export class TeamsModule {}
