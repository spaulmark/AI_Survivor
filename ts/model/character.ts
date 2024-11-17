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
  intent: Intent;
  name: string;
}
export const validIntents = new Set([
  "Ally",
  "Like",
  "Neutral",
  "Dislike",
  "Target",
]);

export type Intent = "Ally" | "Like" | "Neutral" | "Dislike" | "Target";
