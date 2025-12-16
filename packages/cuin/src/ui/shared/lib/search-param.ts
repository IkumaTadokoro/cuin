export function parseCommaSeparated(
  value: string | string[] | undefined
): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return value.split(",").filter(Boolean);
}

export function parseAsString(value: string | string[] | undefined): string {
  if (!value) {
    return "";
  }
  if (Array.isArray(value)) {
    return value[0] || "";
  }
  return value;
}
