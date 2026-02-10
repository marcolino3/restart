import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesResolver } from './roles.resolver';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [RolesResolver, RolesService],
  exports: [RolesService],
})
export class RolesModule {}
