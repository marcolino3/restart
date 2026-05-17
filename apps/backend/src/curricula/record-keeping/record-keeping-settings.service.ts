import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RecordKeepingSettings } from './entities/record-keeping-settings.entity';
import { UpdateRecordKeepingSettingsInput } from './dto/update-record-keeping-settings.input';

export const RECORD_KEEPING_SETTINGS_DEFAULTS = {
  introducedStuckDays: 30,
  practicedStuckDays: 90,
  bigGapDays: 60,
} as const;

@Injectable()
export class RecordKeepingSettingsService {
  constructor(
    @InjectRepository(RecordKeepingSettings)
    private readonly repo: Repository<RecordKeepingSettings>,
  ) {}

  /**
   * Returns the org's settings, or a synthesized row with defaults if the
   * org hasn't customized them yet. The returned object always has an
   * `organizationId` so consumers don't need to special-case null.
   */
  async getForOrg(organizationId: string): Promise<RecordKeepingSettings> {
    const found = await this.repo.findOne({ where: { organizationId } });
    if (found) return found;
    return this.repo.create({ organizationId, ...RECORD_KEEPING_SETTINGS_DEFAULTS });
  }

  async upsertForOrg(
    organizationId: string,
    input: UpdateRecordKeepingSettingsInput,
  ): Promise<RecordKeepingSettings> {
    const existing = await this.repo.findOne({ where: { organizationId } });
    if (existing) {
      existing.introducedStuckDays = input.introducedStuckDays;
      existing.practicedStuckDays = input.practicedStuckDays;
      existing.bigGapDays = input.bigGapDays;
      return this.repo.save(existing);
    }
    const created = this.repo.create({
      organizationId,
      introducedStuckDays: input.introducedStuckDays,
      practicedStuckDays: input.practicedStuckDays,
      bigGapDays: input.bigGapDays,
    });
    return this.repo.save(created);
  }
}
