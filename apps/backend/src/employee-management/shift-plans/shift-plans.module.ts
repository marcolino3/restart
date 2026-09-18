import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { TeamsModule } from '@/employee-management/teams/teams.module';
import { ShiftPlansService } from './shift-plans.service';
import { ShiftPlansResolver } from './shift-plans.resolver';

@Module({
  imports: [CommonModule, DatabaseModule, TeamsModule],
  providers: [ShiftPlansResolver, ShiftPlansService],
  exports: [ShiftPlansService],
})
export class ShiftPlansModule {}
