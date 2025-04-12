import { fetchData } from "../LLM/LLM_google";
import { basicResponseSchema } from "../LLM/schemaFactories";
import { PrivateInformation, PublicInformation } from "../model/character";
import { Message } from "./chatArchive";
import {
  introduceHero,
  introduceManyOthers,
  introduceVillain,
  speakAs,
} from "../model/promptSegments";
import { PlayerModel } from "../model/thought";

export async function generateMessage(
  hero: PrivateInformation,
  villain: PublicInformation,
  heroModel: PlayerModel,
  thingsToSay: string[],
  otherCharacters: PublicInformation[],
  messageHistory: Message[],
  additionalContext?: string
) {
  // TODO: add the trust level here later if its a good idea to do so

  // TODO: pull relevant context for thoughts for other characters inline.

  const prompt = `${introduceHero(hero)}
  ${hero.name} is currently speaking privately with ${villain.name}:
  ${introduceVillain(villain)}
  ${hero.name} currently has the following private thoughts about ${
    villain.name
  } (and depending on what they are, they may want to keep these thoughts private!): ${
    // this is cursed
    heroModel[villain.name].my_thoughts.at(-1)!.thought.thoughts
  }
  ${introduceManyOthers(otherCharacters)}
  ${textifyMessageHistory(messageHistory)}
  ${
    messageHistory.length > 0 ? "Continue" : "Start"
  } the conversation by writing a message from ${hero.name} to ${
    villain.name
  }, that fulfills all of their requirements: ${thingsToSay}
  ${additionalContext || ""} 
  ${speakAs(hero)}
  `;

  const result = await fetchData(prompt, basicResponseSchema);
  return JSON.parse(result)["response"];
}

function textifyMessageHistory(messages: Message[]): string {
  if (messages.length === 0) return "";
  let result = "";
  for (const message of messages) {
    result += `${message.from} to ${message.to}: ${message.text}\n`;
  }
  return result;
}
