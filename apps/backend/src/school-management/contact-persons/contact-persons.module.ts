import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { ContactPersonsResolver } from './contact-persons.resolver';
import { ContactPersonsService } from './contact-persons.service';
import { ContactPersonsController } from './contact-persons.controller';

@Module({
  imports: [CommonModule, DatabaseModule],
  controllers: [ContactPersonsController],
  providers: [ContactPersonsResolver, ContactPersonsService],
  exports: [ContactPersonsService],
})
export class ContactPersonsModule {}
