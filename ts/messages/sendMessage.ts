import { fetchData } from "../LLM/LLM_google";
import { basicResponseSchema } from "../LLM/schemaFactories";
import { PrivateInformation, PublicInformation } from "../model/character";
import { Message } from "./chatArchive";
import { introduceHero, speakAs } from "../model/promptSegments";
import { getAllCurrentThoughts, PlayerModel } from "../model/thought";

export async function generateMessage(
  hero: PrivateInformation,
  villain: PublicInformation,
  heroModel: PlayerModel,
  thingsToSay: string[],
  villainMessageHistory: Message[],
  othersMessageHistory: { [name: string]: Message[] },
  messagesUntilVote: number
) {
  let extendedMessageHistory = "";
  for (const msgs of Object.values(othersMessageHistory)) {
    extendedMessageHistory += textifyMessageHistory(msgs);
  }

  const allCurrentThoughts = JSON.stringify(getAllCurrentThoughts(heroModel));
  const prompt = `${introduceHero(hero)}
${hero.name} is currently speaking privately with ${villain.name}.
${
  hero.name
} currently has the following private thoughts about the other players in the game (which they may or may not want to keep private): ${allCurrentThoughts}
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
Including this message, ${
    hero.name
  } has ${messagesUntilVote} messages they can send until the next vote occurs.
  ${speakAs(hero)}
  `;
  const result = await fetchData(prompt, basicResponseSchema);
  return JSON.parse(result)["response"];
}

function textifyMessageHistory(messages: Message[]): string {
  if (messages.length === 0) return "";
  let result = `<Begin Message History of ${messages[0].to} and ${messages[0].from}>\n`;
  for (const message of messages) {
    result += `<${message.from} to ${message.to}>: ${message.text}\n`;
  }
  result += `<End Message History of ${messages[0].to} and ${messages[0].from}>\n`;
  return result;
}
