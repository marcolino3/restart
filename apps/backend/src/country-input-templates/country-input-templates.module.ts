import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { CountryInputTemplatesService } from './country-input-templates.service';
import { CountryInputTemplatesResolver } from './country-input-templates.resolver';

@Module({
  imports: [DatabaseModule],
  providers: [CountryInputTemplatesResolver, CountryInputTemplatesService],
  exports: [CountryInputTemplatesService],
})
export class CountryInputTemplatesModule {}
