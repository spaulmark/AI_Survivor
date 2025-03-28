import { intentionDefs } from "../firstImpressions";
import { fetchData } from "../LLM/LLM_google";
import { getDecisionsWithReasoning } from "../LLM/schemaFactories";
import { DecisionWithReasoning, PrivateInformation } from "../model/character";
import { Thought } from "../model/thought";
import {
  defineDecisionWithReasoning,
  introduceHero,
  speakAs,
} from "../model/promptSegments";

export async function fixAllLiked(
  hero: PrivateInformation,
  thoughts: Thought[]
): Promise<DecisionWithReasoning> {
  const prompt: string = `${introduceHero(hero)}
  ${intentionDefs}

You currently Like or Ally everyone remaining in the game, but you need to pick someone to vote out next. Based on ${
    hero.name
  }'s personality, select the character that best fits a definition of Neutral, Dislike, or Target, and justify ${
    hero.name
  } would pick this choice over all the other choices.

Options:
${JSON.stringify(thoughts, null, 2)}

${defineDecisionWithReasoning} ${speakAs(hero)}
`;

  const result: DecisionWithReasoning = JSON.parse(
    await fetchData(prompt, getDecisionsWithReasoning(thoughts, 1))
  )[0];
  return result;
}
