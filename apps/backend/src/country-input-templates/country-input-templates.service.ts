import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CountryInputFieldType,
  CountryInputTemplate,
} from './entities/country-input-template.entity';
import { UpsertCountryInputTemplateInput } from './dto/upsert-country-input-template.input';

@Injectable()
export class CountryInputTemplatesService {
  constructor(
    @InjectRepository(CountryInputTemplate)
    private readonly repo: Repository<CountryInputTemplate>,
  ) {}

  findAll(): Promise<CountryInputTemplate[]> {
    return this.repo.find({
      order: { fieldType: 'ASC', countryCode: 'ASC' },
    });
  }

  async findByCountryAndField(
    countryCode: string,
    fieldType: CountryInputFieldType,
  ): Promise<CountryInputTemplate | null> {
    return this.repo.findOne({
      where: { countryCode: countryCode.toUpperCase(), fieldType },
    });
  }

  async upsert(
    input: UpsertCountryInputTemplateInput,
  ): Promise<CountryInputTemplate> {
    const countryCode =
      input.countryCode === '*' ? '*' : input.countryCode.toUpperCase();

    const existing = await this.repo.findOne({
      where: { countryCode, fieldType: input.fieldType },
    });

    if (existing) {
      Object.assign(existing, { ...input, countryCode });
      return this.repo.save(existing);
    }

    return this.repo.save(this.repo.create({ ...input, countryCode }));
  }

  async remove(id: string): Promise<boolean> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`CountryInputTemplate ${id} not found`);
    }
    await this.repo.remove(template);
    return true;
  }
}
