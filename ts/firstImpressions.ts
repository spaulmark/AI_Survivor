import {
  PrivateInformation,
  Thought,
  Intent,
  validIntents,
  PublicInformation,
} from "./model/character";
import { fetchData } from "./LLM/LLM_google";
import { retry3times } from "./LLM/retry3times";
import { firstImpressionsSchema, intentSchema } from "./LLM/schemaFactories";
import { introduceHero, speakAs as speakAs } from "./model/promptSegments";

export const intentionDefs: string = `Here are the possible opinions you can have about other players:
Ally - This character seems like someone I want to try building a game relationship/alliance with.
Like - This character seems useful to me and my objectives in some way, either as a potential ally or as someone I manipulate. 
Neutral - I can't tell if this character is a help or harm to me and my objectives, I plan to observe them.
Dislike - I do not have any plans including this character, and/or they may be an obstacle to me. 
Target - This character is a threat/obstacle to me or my objectives. I want them eliminated soon.
`;

export async function thoughtsToIntent(
  hero: PrivateInformation,
  thoughts: { name: string; thoughts: string }
): Promise<Intent> {
  const prompt = `${introduceHero(hero)}
  
These are the private thoughts of ${hero} about ${
    thoughts.name
  }, another player in the game.

${JSON.stringify(thoughts)} 

Which action option matches the private thoughts about the above character? 

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
  return result;
}

export async function generateDisjointFirstImpressions(
  hero: PrivateInformation,
  villains: PublicInformation[]
): Promise<{ name: string; thoughts: string; intent: Intent }[]> {
  console.log(`Generating first impressions for ${hero.name}`);
  const others: PublicInformation[] = [];
  for (const villain of villains) {
    if (villain.name === hero.name) continue;
    others.push(villain);
  }
  const result = [];
  for (const other of others) {
    const prompt = `${introduceHero(hero)}
    Give a short 1-2 sentence first impression the following character in the context of ${
      hero.name
    }'s initial goal. ${speakAs(hero)}
    ${JSON.stringify(other, null, 2)}
    `;
    let data;
    data = await fetchData(prompt, firstImpressionsSchema([other.name]));
    const parsedThoughts = JSON.parse(data);

    let thought;
    for (const [name, thoughts] of Object.entries(parsedThoughts)) {
      thought = {
        name,
        thoughts: thoughts as string,
      };

      const intent = await thoughtsToIntent(hero, thought);
      result.push({
        name,
        thoughts: thoughts as string,
        intent,
      });
    }
  }
  return result;
}
