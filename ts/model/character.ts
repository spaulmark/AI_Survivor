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
export function getPrivateInformation(
  character: PrivateInformation
): PrivateInformation {
  return {
    name: character.name,
    appearance: character.appearance,
    personality: character.personality,
    initialGoal: character.initialGoal,
  };
}

export function getPublicInformation(
  character: PublicInformation
): PublicInformation {
  return {
    name: character.name,
    appearance: character.appearance,
  };
}

export interface DecisionWithReasoning {
  decision: string;
  reasoning: string;
}
