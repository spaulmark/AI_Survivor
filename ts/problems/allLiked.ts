import { intentionDefs } from "../firstImpressions";
import { fetchData } from "../LLM/LLM_google";
import { getDecisionsWithReasoning } from "../LLM/schemaFactories";
import {
  DecisionWithReasoning,
  PrivateInformation,
  Thought,
} from "../model/character";

export async function fixAllLiked(
  hero: PrivateInformation,
  thoughts: Thought[]
): Promise<DecisionWithReasoning> {
  const prompt: string = `You are ${JSON.stringify(
    hero,
    null,
    2
  )}, and you are playing Survivor. Here are the possible opinions you can have about other players:
  ${intentionDefs}

You currently Like or Ally everyone remaining in the game, but you need to pick someone to vote out next. Based on ${
    hero.name
  }'s personality, select the character that best fits a definition of Neutral, Dislike, or Target, and justify ${
    hero.name
  } would pick this choice over all the other choices.

Options:
${JSON.stringify(thoughts, null, 2)}

Reply in the following format:
[{
"decision": "",
"reasoning": ""
}]
Decision should be the name of the character, and reasoning should contain the 1-2 sentences of justification. 
`;

  const result: DecisionWithReasoning = JSON.parse(
    await fetchData(prompt, getDecisionsWithReasoning(thoughts, 1))
  )[0];
  return result;
}
