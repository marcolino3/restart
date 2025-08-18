import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { MembershipsResolver } from './memberships.resolver';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { RolesModule } from '@/roles/roles.module';

@Module({
  imports: [CommonModule, DatabaseModule, RolesModule],
  providers: [MembershipsResolver, MembershipsService],
})
export class MembershipsModule {}
