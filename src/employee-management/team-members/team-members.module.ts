import { Module } from '@nestjs/common';
import { TeamMembersService } from './team-members.service';
import { TeamMembersResolver } from './team-members.resolver';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [TeamMembersResolver, TeamMembersService],
})
export class TeamMembersModule {}
