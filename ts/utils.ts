export function sleep(ms: number) {
  console.log(`Sleeping ${ms}ms`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
