import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  FEATURE_CATALOG,
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
    // default to their catalog `defaultEnabled` value until a SuperAdmin
    // explicitly toggles them, so the list shown always covers the full
    // current catalog.
    return ORG_FEATURE_KEYS.map(
      (featureKey) =>
        byKey.get(featureKey) ??
        this.toggleRepo.create({
          organizationId,
          featureKey,
          enabled: FEATURE_CATALOG[featureKey].defaultEnabled,
        }),
    );
  }

  private getDependents(featureKey: OrgFeatureKey): OrgFeatureKey[] {
    return ORG_FEATURE_KEYS.filter(
      (key) => FEATURE_CATALOG[key].dependsOn === featureKey,
    );
  }

  async setEnabled(
    organizationId: string,
    featureKey: OrgFeatureKey,
    enabled: boolean,
    changedById: string,
  ): Promise<OrganizationFeatureToggle[]> {
    const keysToUpdate = [featureKey];
    // Disabling a parent feature must also disable and persist its
    // dependents, not just lock them in the UI, so a direct mutation call
    // can't leave a child feature enabled with its parent off.
    if (!enabled) {
      keysToUpdate.push(...this.getDependents(featureKey));
    }

    const existing = await this.toggleRepo.find({
      where: { organizationId },
    });
    const byKey = new Map(existing.map((t) => [t.featureKey, t]));

    const toggles = keysToUpdate.map((key) => {
      const toggle =
        byKey.get(key) ??
        this.toggleRepo.create({ organizationId, featureKey: key });
      toggle.enabled = key === featureKey ? enabled : false;
      toggle.changedById = changedById;
      return toggle;
    });

    return this.toggleRepo.save(toggles);
  }

  /**
   * Wendet mehrere Toggle-Updates in einem Request an (Bulk-Chips wie
   * "Kernmodule" / "Alles" / "Ohne Beta"). Nutzt intern dieselbe
   * Kaskadenlogik pro Update wie setEnabled und sammelt alle betroffenen
   * Toggles ueber alle Updates hinweg (deduped nach featureKey, letztes
   * Update pro Key gewinnt).
   */
  async bulkSetEnabled(
    organizationId: string,
    updates: { featureKey: OrgFeatureKey; enabled: boolean }[],
    changedById: string,
  ): Promise<OrganizationFeatureToggle[]> {
    const resultByKey = new Map<OrgFeatureKey, OrganizationFeatureToggle>();

    for (const update of updates) {
      const affected = await this.setEnabled(
        organizationId,
        update.featureKey,
        update.enabled,
        changedById,
      );
      for (const toggle of affected) {
        resultByKey.set(toggle.featureKey as OrgFeatureKey, toggle);
      }
    }

    return Array.from(resultByKey.values());
  }
}
