import {
  PrivateInformation,
  Thought,
  Intent,
  validIntents,
  PublicInformation,
} from "./model/character";
import { retry3times, fetchData, isValidJson } from "./LLM";

export const intentionDefs: string = `Ally - I have a very good first impression, I will prioritize forming an alliance with this character.
Like - This character seems useful to me and my objectives in some way, either as a potential ally or a pawn. 
Neutral - I can't tell if this character is a help or harm to me and my objectives, I plan to observe them.
Dislike - I do not have any plans including this character, and they may be an obstacle to me. 
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

Your response should be a single word. One of: Ally/Like/Neutral/Dislike/Target

RESPONSE: 
`;
  const isValidIntent = (intent: string): intent is Intent =>
    validIntents.has(intent.trim());
  let result;
  result = await retry3times(
    () => fetchData(prompt, { tokenlimit: 2 }),
    isValidIntent,
    `thoughtsToIntent prompt did not generate a valid intent for ${hero.name}`
  );
  return result.trim();
}
export async function generateFirstImpressions(
  hero: PrivateInformation,
  villains: PublicInformation[]
) {
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

  Format these thoughts in the following way. All text returned should be inside of the [ ].
  [
  "character_name": {
  "thoughts": "my thoughts"
  },
  ]
  ${JSON.stringify(others, null, 2)}
  `;
  let result;
  result = await retry3times(
    () => fetchData(prompt, { stop: ["]"] }),
    isValidJson,
    `generateFirstImpressions prompt did not generate valid json for ${hero.name}`
  );
  return result;
}
