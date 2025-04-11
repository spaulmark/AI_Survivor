import {
  getPrivateInformation,
  getPublicInformation,
  PrivateInformation,
  PublicInformation,
} from "./character";

export function thinkAs(hero: { name: string }): string {
  return `Speak in first person the words that ${hero.name} would be thinking in their head.`;
}

export function speakAs(hero: { name: string }): string {
  return `Speak in first person the words that ${hero.name} would say out loud if they were having a conversation in person.`;
}

export const defineDecisionWithReasoning = `Reply in the following format:
  [{
  "decision": "",
  "reasoning": ""
  },
  ...
  ]
  Decision should be the name of the character, and reasoning should contain the 1-2 sentences of justification.`;

export function introduceHero(hero: PrivateInformation): string {
  return `${
    hero.name
  } is playing Survivor, a game where you have to form opinions on others, make alliances and vote people out.
    ${JSON.stringify(getPrivateInformation(hero))}`;
}

export function introduceVillain(villain: PublicInformation): string {
  return `${villain.name} is another player in the game: ${JSON.stringify(
    getPublicInformation(villain)
  )}`;
}

export function introduceManyOthers(others: PublicInformation[]): string {
  if (others.length === 0) return "";
  let prompt = `Here are the other relevant players for this scenario:
  `;
  for (const other of others) {
    prompt += `${JSON.stringify(getPublicInformation(other))}
  `;
  }
  return prompt;
}
