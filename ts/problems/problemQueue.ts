import { Problem } from "./ingameProblem/problemId";

// A problem queue for an individual player.
export class ProblemQueue {
  private queues: {
    [id: string]: {
      highestPriority: number;
      allPriorities: number[];
      msgsToSend: string[];
    };
  } = {};

  public constructor(names: string[]) {
    for (const name of names) {
      this.clearQueue(name);
    }
  }

  public addProblem(problem: Problem) {
    let priority =
      problem.problemid_priority * 10000 + problem.individual_priority;
    for (const [personToMessage, messageToSend] of Object.entries(
      problem.solution
    )) {
      this.queues[personToMessage].msgsToSend.push(messageToSend);
      this.queues[personToMessage].allPriorities.push(priority);
      if (priority > this.queues[personToMessage].highestPriority) {
        this.queues[personToMessage].highestPriority = priority;
      }
    }
  }

  // find the highest priority, return their list of problems, then clear their queue.
  public pop(): { name: string; msgsToSend: string[] } {
    let currentHighestPriority: number = -2;
    let othersFromHighestPriority: number[] = [];
    let result: string[] = [];
    let currentHighestName: string = "";
    for (const [name, queue] of Object.entries(this.queues)) {
      if (queue.highestPriority > currentHighestPriority) {
        // update highest priority
        currentHighestPriority = queue.highestPriority;
        othersFromHighestPriority = queue.allPriorities;
        result = queue.msgsToSend;
        currentHighestName = name;
      } else if (queue.highestPriority === currentHighestPriority) {
        // if a tie, only update highest priority if tiebreak was successful
        if (
          comparePriorities(queue.allPriorities, othersFromHighestPriority) ===
          1
        ) {
          othersFromHighestPriority = queue.allPriorities;
          result = queue.msgsToSend;
          currentHighestName = name;
        }
      }
    }
    this.clearQueue(currentHighestName);
    return { name: currentHighestName, msgsToSend: result };
  }

  public clearQueue(name: string) {
    this.queues[name] = {
      highestPriority: -1,
      msgsToSend: [],
      allPriorities: [],
    };
  }

  public deletePlayer(name: string) {
    delete this.queues[name];
  }

  public clearAll() {
    this.queues = {};
  }
}

function comparePriorities(a: number[], b: number[]): number {
  const sortedA = [...a].sort((x, y) => y - x);
  const sortedB = [...b].sort((x, y) => y - x);
  const len = Math.max(sortedA.length, sortedB.length);
  for (let i = 0; i < len; i++) {
    const valA = sortedA[i] ?? -Infinity;
    const valB = sortedB[i] ?? -Infinity;
    if (valA > valB) return 1;
    if (valA < valB) return -1;
  }
  return 0;
}
