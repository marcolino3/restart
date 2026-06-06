import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdmissionBoardSettings } from './entities/admission-board-settings.entity';

@Injectable()
export class AdmissionBoardSettingsService {
  constructor(
    @InjectRepository(AdmissionBoardSettings)
    private readonly repo: Repository<AdmissionBoardSettings>,
  ) {}

  /**
   * Returns the persisted settings for the org, or a transient default row
   * (not saved) when none exist yet. Never leaks another org's settings.
   */
  async findForOrg(organizationId: string): Promise<AdmissionBoardSettings> {
    const existing = await this.repo.findOne({ where: { organizationId } });
    if (existing) return existing;
    return this.repo.create({ organizationId, tableColumns: null });
  }

  async upsertTableColumns(
    tableColumns: string[],
    organizationId: string,
  ): Promise<AdmissionBoardSettings> {
    const existing = await this.repo.findOne({ where: { organizationId } });
    if (existing) {
      existing.tableColumns = tableColumns;
      return this.repo.save(existing);
    }
    const created = this.repo.create({ organizationId, tableColumns });
    return this.repo.save(created);
  }
}
