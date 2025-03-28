let round = 0;
let current_message = 0;

export interface Time {
  round: number;
  current_message: number;
}

export function getCurrentTime(): Time {
  return { round, current_message };
}

export function resetTime() {
  round = 0;
  current_message = 0;
}

export function increaseRound() {
  round++;
}
export function increaseMessageCount() {
  current_message++;
}
