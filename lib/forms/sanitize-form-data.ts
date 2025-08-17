export const sanitizeFormData = <T>(input: T): T => {
  if (typeof input !== "object" || input === null) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeFormData) as T;
  }

  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => {
      if (value === null || value === "") return [key, undefined];
      if (typeof value === "object") return [key, sanitizeFormData(value)];
      return [key, value];
    })
  ) as T;
};
