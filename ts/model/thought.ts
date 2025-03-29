import { Intent } from "./Intent";
import { Time } from "./chatArchive";

export function isThought(x: Thought[] | string[]): x is Thought[] {
  return typeof x[0] === "object";
}
export interface Thought {
  thoughts: string;
  name: string;
  intent: Intent;
}

export interface ThoughtHistory {
  thought: Thought;
  time: Time;
}

export interface PlayerModel {
  [name: string]: {
    my_thoughts: ThoughtHistory[];
    their_thoughts: { [name: string]: ThoughtHistory[] };
  };
}

export function getAllCurrentThoughts(model: PlayerModel): Thought[] {
  const result = [];
  for (const enemy of Object.values(model)) {
    const mostRecentThought = enemy.my_thoughts.at(-1);
    if (mostRecentThought) result.push(mostRecentThought.thought);
  }
  return result;
}
