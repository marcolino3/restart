import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsResolver } from './permissions.resolver';
import { PermissionBootstrapService } from './permission-bootstrap.service';
import { DatabaseModule } from '@/database/database.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [
    PermissionBootstrapService,
    PermissionsResolver,
    PermissionsService,
  ],
  exports: [PermissionsService],
})
export class PermissionsModule {}
