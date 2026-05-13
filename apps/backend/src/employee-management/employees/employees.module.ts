import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesResolver } from './employees.resolver';
import { EmployeesController } from './employees.controller';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [CommonModule, DatabaseModule, UsersModule],
  controllers: [EmployeesController],
  providers: [EmployeesResolver, EmployeesService],
})
export class EmployeesModule {}
