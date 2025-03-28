export const validIntents = new Set([
  "Ally",
  "Like",
  "Neutral",
  "Dislike",
  "Target",
]);

export const intentToNumber = {
  Ally: 2,
  Like: 1,
  Neutral: 0,
  Dislike: -1,
  Target: -2,
};

export type Intent = "Ally" | "Like" | "Neutral" | "Dislike" | "Target";
