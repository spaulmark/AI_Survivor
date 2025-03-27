export interface PrivateInformation {
  name: string;
  appearance: string;
  personality: string;
  initialGoal: string;
}
export interface PublicInformation {
  name: string;
  appearance: string;
}
export function getPrivateInformation(character: PrivateInformation) {
  return {
    name: character.name,
    appearance: character.appearance,
    personality: character.personality,
    initialGoal: character.initialGoal,
  };
}
export interface Thought {
  thoughts: string;
  name: string;
  intent: Intent;
}

export interface DecisionWithReasoning {
  decision: string;
  reasoning: string;
}

export function isThought(x: Thought[] | string[]): x is Thought[] {
  return typeof x[0] === "object";
}

export const validIntents = new Set([
  "Ally",
  "Like",
  "Neutral",
  "Dislike",
  "Target",
]);

export type Intent = "Ally" | "Like" | "Neutral" | "Dislike" | "Target";
