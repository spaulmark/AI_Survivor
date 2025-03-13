import { intentionDefs } from "../firstImpressions";
import { fetchData } from "../LLM/LLM_google";
import { getDecisionsWithReasoning } from "../LLM/schemaFactories";
import {
  Thought,
  PrivateInformation,
  getPrivateInformation,
  DecisionWithReasoning,
} from "../model/character";
import {
  defineDecisionWithReasoning,
  introduceHero,
  speakAs,
} from "../model/promptSegments";
import { fixAllLiked } from "./allLiked";
import { fixOver2Targets } from "./over2Targets";

function getMajority(n: number): number {
  const totalPeople = n + 1; // include yourself
  const majority = Math.floor(totalPeople / 2) + 1;
  // You already are your own ally, so subtract 1
  return majority - 1;
}

export function detectOpinionProblems(thoughts: Thought[]): OpinionProblem[] {
  let targets = 0;
  let liked_or_ally = 0;
  let disliked_or_targeted = 0;
  let other_people = thoughts.length;
  let majority = getMajority(other_people) + 1; // + 1 because you always "ally" yourself, and you are not counted in thoughts abt others
  for (const thought of thoughts) {
    thought.intent === "Target" && targets++ && disliked_or_targeted++;
    thought.intent === "Dislike" && disliked_or_targeted++;
    (thought.intent === "Ally" || thought.intent === "Like") && liked_or_ally++;
  }
  const problems: OpinionProblem[] = [];
  if (liked_or_ally === thoughts.length)
    problems.push(OpinionProblem.ALL_LIKED);
  if (targets > 2) problems.push(OpinionProblem.OVER_2_TARGETS);
  if (disliked_or_targeted >= majority)
    problems.push(OpinionProblem.DISLIKES_GEQ_MAJORITY);
  return problems;
}
export enum OpinionProblem {
  OVER_2_TARGETS = "OVER_2_TARGETS",
  ALL_LIKED = "ALL_LIKED",
  DISLIKES_GEQ_MAJORITY = "DISLIKES_GEQ_MAJORITY",
}

export async function fixOpinionProblems(
  problems: OpinionProblem[],
  hero: PrivateInformation,
  thoughts: Thought[]
) {
  problems.length && console.log(hero.name, "has opinion problems:", problems);
  for (const problem of problems) {
    const privateInfo: PrivateInformation = getPrivateInformation(hero);
    if (problem === OpinionProblem.OVER_2_TARGETS) {
      const solution = await fixOver2Targets(privateInfo, thoughts);
      for (const thought of thoughts) {
        if (
          thought.intent === "Target" &&
          solution[0].name !== thought.name &&
          solution[1].name !== thought.name
        )
          thought.intent = "Dislike";
      }
    } else if (problem === OpinionProblem.ALL_LIKED) {
      const solution = await fixAllLiked(privateInfo, thoughts);
      for (const thought of thoughts) {
        if (thought.name === solution.decision) thought.intent = "Neutral";
      }
    } else if (problem === OpinionProblem.DISLIKES_GEQ_MAJORITY) {
      const solution = await fixDislikesGeqMajority(privateInfo, thoughts);
      const solutionSet = new Set(solution.map((x) => x.decision));
      for (const thought of thoughts) {
        if (solutionSet.has(thought.name)) thought.intent = "Neutral";
      }
    }
  }
}

async function fixDislikesGeqMajority(
  hero: PrivateInformation,
  thoughts: Thought[]
): Promise<DecisionWithReasoning[]> {
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
