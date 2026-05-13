import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { AddressesService } from './addresses.service';
import { AddressesResolver } from './addresses.resolver';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [AddressesResolver, AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
