import {
  PrivateInformation,
  Thought,
  Intent,
  validIntents,
  PublicInformation,
} from "./model/character";
import { fetchData } from "./LLM/LLM_google";
import { retry3times } from "./LLM/LLM";
import { firstImpressionsSchema, intentSchema } from "./LLM/schemaFactories";

export const intentionDefs: string = `Ally - I have a very good first impression, I will prioritize forming an alliance with this character.
Like - This character seems useful to me and my objectives in some way, either as a potential ally or a pawn. 
Neutral - I can't tell if this character is a help or harm to me and my objectives, I plan to observe them.
Dislike - I do not have any plans including this character, and/or they may be an obstacle to me. 
Target - This character is a threat/obstacle to me or my objectives. I want them eliminated soon.
`;

export async function thoughtsToIntent(
  hero: PrivateInformation,
  thoughts: Thought
): Promise<Intent> {
  const prompt = `Survivor is a game where you have to form opinions on others, make alliances and vote people out.

This is someone's private thought about ${thoughts.name}.

${JSON.stringify(thoughts)} 

Which action option matches the private thoughts about the above character? 

List of action options:
${intentionDefs}
`;
  const isValidIntent = (intent: string): intent is Intent =>
    validIntents.has(intent);
  let result;
  result = await retry3times(
    async () => {
      const result = await fetchData(prompt, intentSchema);
      return result.replace(/"/g, "");
    },
    isValidIntent,
    (result) =>
      `thoughtsToIntent prompt did not generate a valid intent for ${hero.name}, it said ${result}`
  );
  return result.trim();
}
export async function generateFirstImpressions(
  hero: PrivateInformation,
  villains: PublicInformation[]
): Promise<{ name: string; thoughts: string }[]> {
  console.log(`Generating first impressions for ${hero.name}`);
  const others = [];
  for (const villain of villains) {
    if (villain.name === hero.name) continue;
    others.push(villain);
  }
  const prompt = `
  ${hero.name} is playing Survivor.
  ${JSON.stringify(hero)}
  Give a short 1-2 sentence first impression of each of the following characters in the context of ${
    hero.name
  }'s initial goal.
  ${JSON.stringify(others, null, 2)}
  `;
  let data;
  data = await fetchData(
    prompt,
    firstImpressionsSchema(others.map((x) => x.name))
  );
  /*  
  {
  "Cirno": "Oh man",
}  convert to    {
          "name": "Cirno",
          "thoughts": "Oh man", },
*/
  const parsedThoughts = JSON.parse(data);
  const result = [];
  for (const [name, thoughts] of Object.entries(parsedThoughts)) {
    result.push({ name, thoughts: thoughts as string });
  }

  return result;
}
