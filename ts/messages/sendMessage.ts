import { fetchData } from "../LLM/LLM_google";
import { basicResponseSchema } from "../LLM/schemaFactories";
import { PrivateInformation, PublicInformation } from "../model/character";
import { Message } from "./chatArchive";
import {
  explainVotingDeadline,
  introduceFirstImpressions,
  introduceHero,
  speakAs,
  textifyMessageHistories,
  textifyMessageHistory,
} from "../model/promptSegments";
import { PlayerModel } from "../model/thought";

export async function generateMessage(
  hero: PrivateInformation,
  villain: PublicInformation,
  heroModel: PlayerModel,
  thingsToSay: string[],
  villainMessageHistory: Message[],
  othersMessageHistory: { [name: string]: Message[] },
  messagesUntilVote: number
) {
  const extendedMessageHistory = textifyMessageHistories(othersMessageHistory);
  const prompt = `${introduceHero(hero)}
${hero.name} is currently speaking privately with ${villain.name}.
${introduceFirstImpressions(hero, heroModel)}
${
  extendedMessageHistory
    ? `These are all of ${hero.name}'s other private conversations so far:
      ${extendedMessageHistory}`
    : ""
}
${textifyMessageHistory(villainMessageHistory)}
${
  villainMessageHistory.length > 0 ? "Continue" : "Start"
} the conversation by writing a message from ${hero.name} to ${villain.name}${
    thingsToSay
      ? `, that fulfills all of their requirements: ${thingsToSay}`
      : "."
  }
${explainVotingDeadline(hero.name, messagesUntilVote)}
${speakAs(hero)}`;
  const result = await fetchData(prompt, basicResponseSchema);
  return JSON.parse(result)["response"];
}
