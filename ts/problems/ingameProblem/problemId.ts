interface Problem {
  problemid_priority: number;
  individual_priority: number;
  id: ProblemID;
  // a solution function that needs to be called to solve it?
  // a solution type. do you just need to change your opinion? send a message? make and execute a plan?
}

let getProblemPriority: { [id: string]: number } = {};

// TODO: Make sure if you like someone, you tell them you like them.(based on personality?)
// TODO: Don't know first impressions of player
// TODO: Unanswered question from player

export function createProblem(
  id: ProblemID,
  individual_priority: number
): Problem {
  return {
    problemid_priority: getProblemPriority[id],
    id,
    individual_priority,
  };
}

export function initializeProblems() {
  let i = 0;
  for (const id in problemids) {
    getProblemPriority[id] = i;
    i++;
  }
}

// lowest priority -> highest priority
export const problemids: ProblemID[] = ["PLAYER_NOT_CONTACTED"];

export type ProblemID = "PLAYER_NOT_CONTACTED";
