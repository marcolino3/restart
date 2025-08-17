// utils/mapEnumToOptions.ts

export function mapEnumToOptions<T extends Record<string, string>>(
  enumObj: T,
  getLabel?: (value: T[keyof T]) => string
): { value: T[keyof T]; label: string }[] {
  return Object.values(enumObj).map((value) => ({
    value: value as T[keyof T],
    label: getLabel ? getLabel(value as T[keyof T]) : (value as string),
  }));
}
