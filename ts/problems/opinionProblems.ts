import { PrivateInformation, getPrivateInformation } from "../model/character";
import { Thought } from "../model/thought";
import { fixAllLiked } from "./allLiked";
import { fixOver2Targets } from "./over2Targets";
import { fixDislikesGeqMajority } from "./dislikesGeqMajority";

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
