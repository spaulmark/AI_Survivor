import { sleep } from "./utils";

export async function fetchData(
  prompt: string,
  options?: { stop?: string[]; tokenlimit?: number }
): Promise<string> {
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch("http://localhost:5001/api/v1/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          max_context_length: 4096,
          max_length: options?.tokenlimit || 900,
          prompt,
          quiet: false,
          rep_pen: 1.07,
          rep_pen_range: 256,
          rep_pen_slope: 1,
          temperature: 0.5,
          tfs: 1,
          top_a: 0,
          top_k: 100,
          top_p: 0.9,
          typical: 1,
          stop_sequence: options?.stop || [],
        }),
      });
      if (!response.ok) {
        console.log(response);
        throw new Error("Network response was not ok");
      }
      const data = await response.json(); // Parse the JSON from the response

      if (data["error"] && data["error"]["code"] === 429) {
        throw new Error("it was 429");
      }
      return data["results"][0]["text"];
    } catch (error) {
      console.error("Error occured in fetchData:", error);
      await sleep(2000);
    }
  }
  throw new Error("Fetching prompt failed 3 times in a row");
}
export async function retry3times(
  func: () => any,
  validator: (x: any) => boolean,
  error: string
) {
  for (let i = 0; i < 3; i++) {
    let result = await func();
    if (validator(result)) return result;
    console.error(`Failed attempt ${i + 1}/3 for ${error}`);
    await sleep(1000);
  }
  console.error(error);
  throw new Error(error);
}
export function isValidJson(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
