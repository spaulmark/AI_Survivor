export interface Problem {
  problemid_priority: number;
  individual_priority: number;
  id: ProblemID;
  solution: Solution;
}

export interface Solution {
  [name: string]: string;
}

const getProblemPriority: { [id: string]: number } = {};

export function createProblem(
  id: ProblemID,
  individual_priority: number,
  solution: Solution
): Problem {
  return {
    problemid_priority: getProblemPriority[id],
    id,
    individual_priority,
    solution,
  };
}

export function initializeProblems() {
  let i = 0;
  for (const id of problemids) {
    getProblemPriority[id] = i;
    i++;
  }
}

// lowest priority -> highest priority
export const problemids: ProblemID[] = ["PLAYER_NOT_CONTACTED"];

export type ProblemID = "PLAYER_NOT_CONTACTED";
