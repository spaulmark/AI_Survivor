import { GoogleGenerativeAI, Schema } from "@google/generative-ai";

let i = 0;

export async function fetchData(
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

  const result = await model.generateContent(prompt);
  return result.response.text();
}
