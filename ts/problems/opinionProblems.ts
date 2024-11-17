import {
  Thought,
  PrivateInformation,
  getPrivateInformation,
} from "../model/character";
import { fixOver2Targets } from "./over2Targets";

export function detectOpinionProblems(thoughts: Thought[]): OpinionProblem[] {
  let targets = 0;
  let liked_or_ally = 0;
  let disliked_or_targeted = 0;
  let total_people = thoughts.length;
  let majority = Math.floor((total_people + 1) / 2) + 1; // total_people + 1 because you always "ally" yourself, and you are not counted in thoughts abt others
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
    problems.push(OpinionProblem.LIKES_LESS_THAN_MAJORITY);
  return problems;
}
export enum OpinionProblem {
  OVER_2_TARGETS = "OVER_2_TARGETS",
  ALL_LIKED = "ALL_LIKED",
  LIKES_LESS_THAN_MAJORITY = "LIKES_LESS_THAN_MAJORITY",
}
export async function fixOpinionProblems(
  problems: OpinionProblem[],
  hero: PrivateInformation,
  thoughts: Thought[]
) {
  console.log(hero.name, problems);
  for (const problem of problems) {
    if (problem === OpinionProblem.OVER_2_TARGETS) {
      const solution = await fixOver2Targets(
        getPrivateInformation(hero),
        thoughts
      );
      for (const thought of thoughts) {
        if (
          thought.intent === "Target" &&
          solution[0].name !== thought.name &&
          solution[1].name !== thought.name
        )
          thought.intent = "Dislike";
      }
    } else if (problem === OpinionProblem.ALL_LIKED) {
      // TODO: demote somebody to neutral
    } else if (problem === OpinionProblem.LIKES_LESS_THAN_MAJORITY) {
      // TODO: promote people until majority achieved.
    }
  }
}
function fixAllLiked(hero: PrivateInformation, thoughts: Thought[]) {
  //
}
