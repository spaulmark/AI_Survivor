import { fetchData } from "../LLM/LLM_google";
import { decideWhoToMessageSchema } from "../LLM/schemaFactories";
import { Cast } from "../model/cast";
import { getPrivateInformation, PrivateInformation } from "../model/character";
import {
  explainVotingDeadline,
  introduceFirstImpressions,
  introduceHero,
  textifyMessageHistories,
  thinkAs,
} from "../model/promptSegments";
import { ProtoMessage } from "../problems/problemQueue";
import { exclude } from "../utils/utils";
import { ChatArchive } from "./chatArchive";

// TODO: your current history of plans is.... [save and list the plan history]
export async function decideWhoToMessage(
  _hero: PrivateInformation,
  cast: Cast,
  votingDeadline: number,
  msgs: ChatArchive
): Promise<ProtoMessage> {
  const hero = getPrivateInformation(_hero);
  const heroModel = cast[hero.name].brain.model;
  const villains = exclude(cast, [hero]);
  const prompt = `${introduceHero(hero)}
${introduceFirstImpressions(hero, heroModel)}
${explainVotingDeadline(hero.name, votingDeadline)}
What is your current plan in the game, and who do you want to message next?
Here is your list of private 1-on-1 chatlogs with the other players in the game:
${textifyMessageHistories(msgs.getManyChatlogs(hero.name, villains))}
You may want to send a message to someone who is waiting on a reply, rather than messaging someone twice in a row, unless it's important.
${thinkAs(hero)}
Reply in the format {
    plan: <Your short term plans to get through this round, or your long term plans if applicable.>
    playerToMessage: <The name of the next person you want to message to execute your plans.>
}`;
  const raw_result = await fetchData(
    prompt,
    decideWhoToMessageSchema(villains)
  );
  const result = JSON.parse(raw_result);
  console.log(hero.name, result);
  return result;
}
