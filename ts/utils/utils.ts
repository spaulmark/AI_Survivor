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
  _exclusions: { name: string }[] | string[]
) {
  const exclusions = Array.isArray(_exclusions)
    ? new Set(_exclusions as string[])
    : new Set((_exclusions as { name: string }[]).map((x) => x.name));
  return Object.values(cast)
    .filter((x) => !exclusions.has(x.name))
    .map((x) => x.name);
}
