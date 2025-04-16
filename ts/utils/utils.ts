import { Cast } from "../model/cast";

export function sleep(ms: number) {
  console.log(`Sleeping ${ms}ms`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function exclude(
  cast: Cast,
  _exclusions: string[] | { name: string }[]
): string[] {
  const exclusions = Array.isArray(_exclusions)
    ? new Set(_exclusions as string[])
    : new Set((_exclusions as { name: string }[]).map((x) => x.name));
  return Object.values(cast)
    .filter((x) => !exclusions.has(x.name))
    .map((x) => x.name);
}

export function excludeStrings(
  cast: string[],
  _exclusions: string[]
): string[] {
  const exclusions = new Set(_exclusions);
  return cast.filter((x) => !exclusions.has(x));
}

export function listNames(names: string[]): string {
  if (names.length === 0) {
    return "";
  }
  if (names.length === 1) {
    return names[0];
  }
  if (names.length === 2) {
    return names[0] + " and " + names[1];
  }
  return (
    names.slice(0, names.length - 1).join(", ") +
    ", and " +
    names[names.length - 1]
  );
}
