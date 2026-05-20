import { EntityManager } from 'typeorm';
import { AdmissionStage } from '../entities/admission-stage.entity';
import { AdmissionStageType } from '../enums/admission-stage-type.enum';

export interface DefaultAdmissionStageSeed {
  slug: string;
  name: string;
  color: string;
  position: number;
  stageType: AdmissionStageType;
  isDefault: boolean;
}

export const DEFAULT_ADMISSION_STAGES: DefaultAdmissionStageSeed[] = [
  {
    slug: 'lead',
    name: 'Leads',
    color: '#94A3B8',
    position: 0,
    stageType: AdmissionStageType.INITIAL,
    isDefault: true,
  },
];

export async function seedOrgAdmissionStages(
  manager: EntityManager,
  organizationId: string,
): Promise<void> {
  const repo = manager.getRepository(AdmissionStage);
  const existing = await repo.find({
    where: { organizationId },
    select: ['id', 'slug'],
  });
  const existingSlugs = new Set(existing.map((s) => s.slug));

  const toInsert = DEFAULT_ADMISSION_STAGES.filter(
    (s) => !existingSlugs.has(s.slug),
  ).map((s) => repo.create({ ...s, organizationId }));

  if (toInsert.length) {
    await repo.save(toInsert);
  }
}
