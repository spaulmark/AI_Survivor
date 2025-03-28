import { Intent } from "./Intent";
import { Time } from "./time";

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
