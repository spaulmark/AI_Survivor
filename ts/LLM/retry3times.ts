import { sleep } from "../utils";

export async function retry3times(
  func: () => any,
  validator: (x: any) => boolean,
  error: (result: any) => string
) {
  let result;
  for (let i = 0; i < 3; i++) {
    result = await func();
    if (validator(result)) return result;
    console.error(`Failed attempt ${i + 1}/3 for ${error(result)}`);
    await sleep(1000);
  }
  console.error(error(result));
  throw new Error(error(result));
}
