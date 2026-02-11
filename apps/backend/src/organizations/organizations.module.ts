import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsResolver } from './organizations.resolver';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { GoogleModule } from '@/google/google.module';

@Module({
  imports: [CommonModule, DatabaseModule, GoogleModule],
  providers: [OrganizationsResolver, OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
