import { GoogleGenerativeAI, Schema } from "@google/generative-ai";

export async function fetchData(
  prompt: string,
  schema: Schema
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_KEY as string);
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
