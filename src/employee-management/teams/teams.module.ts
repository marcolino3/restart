import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsResolver } from './teams.resolver';

@Module({
  providers: [TeamsResolver, TeamsService],
})
export class TeamsModule {}
