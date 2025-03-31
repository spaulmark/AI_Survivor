import { GoogleGenerativeAI, Schema } from "@google/generative-ai";

let i = 0;

export async function fetchData(
  prompt: string,
  schema: Schema
): Promise<string> {
  const retries = 10;
  let delayMs = 1000;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await _fetchData(prompt, schema);
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed:`, error);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
        console.warn(`Delay increased to ${delayMs}`);
      } else {
        throw new Error("Function failed after maximum retries");
      }
    }
  }
  throw new Error("Unreachable code");
}

export async function _fetchData(
  prompt: string,
  schema: Schema
): Promise<string> {
  const now = new Date();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");
  console.log(`${minutes}:${seconds}:${milliseconds}, calling fetchData.`);
  // rate limits aren't real, rate limits can't hurt me
  const google_keys = [
    process.env.GOOGLE_KEY0 as string,
    process.env.GOOGLE_KEY1 as string,
    process.env.GOOGLE_KEY2 as string,
    process.env.GOOGLE_KEY3 as string,
    process.env.GOOGLE_KEY4 as string,
    process.env.GOOGLE_KEY5 as string,
    process.env.GOOGLE_KEY6 as string,
    process.env.GOOGLE_KEY7 as string,
    process.env.GOOGLE_KEY8 as string,
    process.env.GOOGLE_KEY9 as string,
  ];
  const genAI = new GoogleGenerativeAI(google_keys[i % google_keys.length]);
  i++;
  const modelOptions = {
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  };
  const model = genAI.getGenerativeModel(modelOptions);

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error(error);
    console.error(
      `The error occured with key ${
        (i - 1) % google_keys.length
      }, please check it`
    );
    throw "FETCHDATA FAILED, see error output above.";
  }
}
