type ContractLike = {
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
};

export function isContractValidOn(
  contract: ContractLike,
  todayIso: string,
): boolean {
  const start = contract.startDate?.slice(0, 10);
  if (!start || start > todayIso) return false;
  const end = contract.endDate?.slice(0, 10);
  return !end || end >= todayIso;
}

/**
 * Overview card priority:
 * 1. Contract valid on `today`
 * 2. Most recent past contract (flagged expired)
 * 3. Soonest future contract (e.g. onboarding before entry)
 */
export function pickOverviewContract<T extends ContractLike>(
  contracts: T[],
  todayIso = new Date().toISOString().slice(0, 10),
): { contract: T | undefined; expired: boolean } {
  const active = contracts.filter((c) => c.isActive !== false);
  if (active.length === 0) return { contract: undefined, expired: false };

  const byStartDesc = (a: T, b: T) =>
    (a.startDate ?? "") < (b.startDate ?? "") ? 1 : -1;
  const byStartAsc = (a: T, b: T) =>
    (a.startDate ?? "") > (b.startDate ?? "") ? 1 : -1;

  const valid = active
    .filter((c) => isContractValidOn(c, todayIso))
    .sort(byStartDesc);
  if (valid[0]) return { contract: valid[0], expired: false };

  const past = active
    .filter((c) => c.startDate && c.startDate.slice(0, 10) <= todayIso)
    .sort(byStartDesc);
  if (past[0]) return { contract: past[0], expired: true };

  const upcoming = active
    .filter((c) => c.startDate && c.startDate.slice(0, 10) > todayIso)
    .sort(byStartAsc);
  if (upcoming[0]) return { contract: upcoming[0], expired: false };

  return { contract: undefined, expired: false };
}
