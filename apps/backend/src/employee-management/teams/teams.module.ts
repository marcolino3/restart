import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsResolver } from './teams.resolver';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [TeamsResolver, TeamsService],
})
export class TeamsModule {}
