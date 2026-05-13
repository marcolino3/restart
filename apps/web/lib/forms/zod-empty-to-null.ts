export const emptyToNull = (v: unknown) =>
  v === "" || v === undefined || v === null ? null : v;

export const emptyToUndefined = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;
