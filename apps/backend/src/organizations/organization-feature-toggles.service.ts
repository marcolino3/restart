import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ORG_FEATURE_KEYS,
  type OrgFeatureKey,
} from '@restart/shared-schemas/org-features/feature-catalog';
import { OrganizationFeatureToggle } from '@/organizations/entities/organization-feature-toggle.entity';

@Injectable()
export class OrganizationFeatureTogglesService {
  constructor(
    @InjectRepository(OrganizationFeatureToggle)
    private readonly toggleRepo: Repository<OrganizationFeatureToggle>,
  ) {}

  async findAllForOrg(
    organizationId: string,
  ): Promise<OrganizationFeatureToggle[]> {
    const existing = await this.toggleRepo.find({
      where: { organizationId },
    });
    const byKey = new Map(existing.map((t) => [t.featureKey, t]));

    // New feature keys added to the catalog after an org's rows were seeded
    // default to enabled until a SuperAdmin explicitly toggles them, so the
    // list shown always covers the full current catalog.
    return ORG_FEATURE_KEYS.map(
      (featureKey) =>
        byKey.get(featureKey) ??
        this.toggleRepo.create({ organizationId, featureKey, enabled: true }),
    );
  }

  async setEnabled(
    organizationId: string,
    featureKey: OrgFeatureKey,
    enabled: boolean,
    changedById: string,
  ): Promise<OrganizationFeatureToggle> {
    const existing = await this.toggleRepo.findOne({
      where: { organizationId, featureKey },
    });
    const toggle =
      existing ?? this.toggleRepo.create({ organizationId, featureKey });
    toggle.enabled = enabled;
    toggle.changedById = changedById;
    return this.toggleRepo.save(toggle);
  }
}
