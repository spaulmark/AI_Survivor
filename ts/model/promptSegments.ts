import { Message } from "../messages/chatArchive";
import {
  getPrivateInformation,
  getPublicInformation,
  PrivateInformation,
  PublicInformation,
} from "./character";
import { getAllCurrentThoughts, PlayerModel } from "./thought";

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

// TODO: maybe not "first impressions" once we add periodic reflection
export function introduceFirstImpressions(
  hero: PrivateInformation,
  model: PlayerModel
): string {
  return `${
    hero.name
  } has the following private first impressions about the other players in the game (which they may or may not want to keep private): ${JSON.stringify(
    getAllCurrentThoughts(model)
  )}`;
}

export function explainVotingDeadline(hero: string, deadline: number) {
  return `Including this message, ${hero} has ${deadline} messages they can send until the next vote occurs. 
  Try to get the votes on someone you want gone and protect the people you want to keep about before this number hits 0, or at the very least make sure you're not the one who gets voted out!
  The rules of the game do not allow for someone to vote for themself.`;
}

export function textifyMessageHistory(messages: Message[]): string {
  if (messages.length === 0) return "";
  let result = `<Begin Message History of ${messages[0].to} and ${messages[0].from}>\n`;
  for (const message of messages) {
    result += `<${message.from} to ${message.to}>: ${message.text}\n`;
  }
  result += `<End Message History of ${messages[0].to} and ${messages[0].from}>\n`;
  return result;
}

export function textifyMessageHistories(input: {
  [name: string]: Message[];
}): string {
  let extendedMessageHistory = "";
  for (const msgs of Object.values(input)) {
    extendedMessageHistory += textifyMessageHistory(msgs);
  }
  return extendedMessageHistory;
}

export const basicVotingInstructions = `The time has come to vote somebody out of the game.
  Based on your conversations you had in this round and your thoughts on the other players, who will you vote for?`;

export const dontWasteYourVote = `Keep in mind that throwing a random vote is likely to waste your vote and achieve nothing: you should try to vote for someone who you both want eliminated, and believe other players will vote for too.`;
