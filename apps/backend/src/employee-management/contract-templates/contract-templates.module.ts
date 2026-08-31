import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { ContractTemplatesResolver } from './contract-templates.resolver';
import { ContractTemplatesService } from './contract-templates.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [ContractTemplatesResolver, ContractTemplatesService],
  exports: [ContractTemplatesService],
})
export class ContractTemplatesModule {}
