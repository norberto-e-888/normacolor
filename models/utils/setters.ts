export const setUniqueMembers = (val: string[]): string[] =>
  Array.from(new Set(val));

export const normalize = (value: string): string =>
  value.trim().toLowerCase().split(" ").filter(Boolean).join(" ");

export const round = (value: number): number => Math.round(value);
