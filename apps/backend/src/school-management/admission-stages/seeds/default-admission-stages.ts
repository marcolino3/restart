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
    slug: 'interest',
    name: 'Interesse',
    color: '#64748B',
    position: 0,
    stageType: AdmissionStageType.INITIAL,
    isDefault: true,
  },
  {
    slug: 'application',
    name: 'Bewerbung',
    color: '#0EA5E9',
    position: 1,
    stageType: AdmissionStageType.IN_PROGRESS,
    isDefault: false,
  },
  {
    slug: 'interview',
    name: 'Aufnahmegespräch',
    color: '#6366F1',
    position: 2,
    stageType: AdmissionStageType.IN_PROGRESS,
    isDefault: false,
  },
  {
    slug: 'accepted',
    name: 'Aufgenommen',
    color: '#22C55E',
    position: 3,
    stageType: AdmissionStageType.ACCEPTED,
    isDefault: false,
  },
  {
    slug: 'enrolled',
    name: 'Eingeschrieben',
    color: '#16A34A',
    position: 4,
    stageType: AdmissionStageType.ENROLLED,
    isDefault: false,
  },
  {
    slug: 'rejected',
    name: 'Abgelehnt',
    color: '#EF4444',
    position: 5,
    stageType: AdmissionStageType.REJECTED,
    isDefault: false,
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
