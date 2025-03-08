import { PublicInformation } from "./character";

export function speakAs(hero: { name: string }): string {
  return `Speak in first person the words that ${hero.name} would be thinking in their head.`;
}

export const defineDecisionWithReasoning = `Reply in the following format:
  [{
  "decision": "",
  "reasoning": ""
  },
  ...
  ]
  Decision should be the name of the character, and reasoning should contain the 1-2 sentences of justification.`;

export function introduceHero(hero: PublicInformation): string {
  return `${
    hero.name
  } is playing Survivor, a game where you have to form opinions on others, make alliances and vote people out.
    ${JSON.stringify(hero)}`;
}
