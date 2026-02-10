import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesResolver } from './employees.resolver';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [CommonModule, DatabaseModule, UsersModule],
  providers: [EmployeesResolver, EmployeesService],
})
export class EmployeesModule {}
