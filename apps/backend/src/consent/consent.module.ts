import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { ConsentPurposesResolver } from './consent-purposes.resolver';
import { ConsentPurposesService } from './consent-purposes.service';
import { ConsentsResolver } from './consents.resolver';
import { ConsentsService } from './consents.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [
    ConsentPurposesResolver,
    ConsentPurposesService,
    ConsentsResolver,
    ConsentsService,
  ],
  exports: [ConsentPurposesService, ConsentsService],
})
export class ConsentModule {}
