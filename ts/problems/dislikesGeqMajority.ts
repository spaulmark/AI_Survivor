import { intentionDefs } from "../firstImpressions";
import { fetchData } from "../LLM/LLM_google";
import { getDecisionsWithReasoning } from "../LLM/schemaFactories";
import {
  PrivateInformation,
  DecisionWithReasoning,
  getPrivateInformation,
} from "../model/character";
import {
  introduceHero,
  defineDecisionWithReasoning,
  speakAs,
} from "../model/promptSegments";
import { Thought } from "../model/thought";

export async function fixDislikesGeqMajority(
  _hero: PrivateInformation,
  thoughts: Thought[]
): Promise<DecisionWithReasoning[]> {
  const hero = getPrivateInformation(_hero);
  // first get rid of all the people that we don't dislike
  let negativeThoughts: Thought[] = thoughts.filter(
    (thought) => thought.intent === "Dislike" || thought.intent === "Target"
  );

  const allowed_dislikes: number = Math.floor(thoughts.length / 2);
  const people_to_like: number = negativeThoughts.length - allowed_dislikes;

  const solution: DecisionWithReasoning[] = [];
  for (let i = 0; i < people_to_like; i++) {
    const prompt: string = `${introduceHero(hero)} 
    
    ${intentionDefs}
  
  You currently Dislike or want to Target everyone remaining in the game, but if you don't like anyone, you won't have any allies and will get voted out. Based on ${
    hero.name
  }'s personality, select the character that ${
      hero.name
    } could at least temporarily work with, and justify why ${
      hero.name
    } would pick this choice over all the other choices.
  
  Options:
  ${JSON.stringify(negativeThoughts, null, 2)}
  
${defineDecisionWithReasoning} ${speakAs(hero)}
  `;

    const raw_result: string = await fetchData(
      prompt,
      getDecisionsWithReasoning(negativeThoughts, 1)
    );
    const result: DecisionWithReasoning = JSON.parse(raw_result)[0];
    // eliminate negative thought
    const index = negativeThoughts.findIndex(
      (item) => item.name === result.decision
    );
    if (index !== -1) {
      negativeThoughts.splice(index, 1);
    } else {
      throw `AI generated an invalid name in fixDislikesGeqMajority: valid names: ${negativeThoughts}, got: ${result.decision}`;
    }
    // add result to solution[]
    solution.push(result);
  }
  return solution;
}
