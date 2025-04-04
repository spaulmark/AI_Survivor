import { Problem } from "./ingameProblem/problemId";
import { PriorityQueue } from "./priorityQueue";

export class ProblemQueues {
  private queues: { [id: string]: PriorityQueue<Problem> } = {};

  public constructor(names: string[]) {
    for (const name of names) {
      this.queues[name] = new PriorityQueue<Problem>();
    }
  }

  public getNextProblem(name: string) {
    return this.queues[name].dequeue();
  }

  public addProblem(name: string, problem: Problem) {
    this.queues[name].enqueue(
      problem,
      problem.problemid_priority * 10000 + problem.individual_priority
    );
  }
}
