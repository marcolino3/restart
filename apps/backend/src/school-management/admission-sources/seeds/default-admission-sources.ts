import { EntityManager } from 'typeorm';
import { AdmissionSource } from '../entities/admission-source.entity';

export interface DefaultAdmissionSourceSeed {
  systemKey: string;
  name: string;
  position: number;
}

/**
 * The five former enum values, seeded per organization as editable rows.
 * `systemKey` is a stable, rename-proof identifier used by the backfill and the
 * default lookup — the visible `name` may be changed by the school.
 */
export const DEFAULT_ADMISSION_SOURCES: DefaultAdmissionSourceSeed[] = [
  { systemKey: 'MANUAL', name: 'Manuell erfasst', position: 0 },
  { systemKey: 'PUBLIC_FORM', name: 'Online-Formular', position: 1 },
  { systemKey: 'OPEN_DAY', name: 'Tag der offenen Tür', position: 2 },
  { systemKey: 'REFERRAL', name: 'Empfehlung', position: 3 },
  { systemKey: 'OTHER', name: 'Sonstiges', position: 4 },
];

export async function seedOrgAdmissionSources(
  manager: EntityManager,
  organizationId: string,
): Promise<void> {
  const repo = manager.getRepository(AdmissionSource);
  const existing = await repo.find({
    where: { organizationId },
    select: ['id', 'systemKey'],
  });
  const existingKeys = new Set(existing.map((s) => s.systemKey));

  const toInsert = DEFAULT_ADMISSION_SOURCES.filter(
    (s) => !existingKeys.has(s.systemKey),
  ).map((s) => repo.create({ ...s, organizationId }));

  if (toInsert.length) {
    await repo.save(toInsert);
  }
}
