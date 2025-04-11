import { getPrivateInformation, PrivateInformation } from "../model/character";
import { thinkAs } from "../model/promptSegments";
import { fetchData } from "./LLM_google";
import { BasicResponse, basicResponseSchema } from "./schemaFactories";

export async function translateToOwnWords(
  _hero: PrivateInformation,
  message: string
): Promise<string> {
  const hero = getPrivateInformation(_hero);
  const prompt = `${JSON.stringify(hero)}
    If ${
      hero.name
    } was thinking "${message}", how would they say it in their own words?
    ${thinkAs(hero)} 
    `;

  const result = JSON.parse(
    await fetchData(prompt, basicResponseSchema)
  ) as BasicResponse;
  return result.response;
}
