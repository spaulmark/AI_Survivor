import { fetchData } from "../LLM/LLM_google";
import { getDecisionsWithReasoning } from "../LLM/schemaFactories";
import { ChatArchive } from "../messages/chatArchive";
import { Cast } from "../model/cast";
import {
  DecisionWithReasoning,
  getPrivateInformation,
  PrivateInformation,
} from "../model/character";
import {
  introduceHero,
  introduceFirstImpressions,
  textifyMessageHistories,
  thinkAs,
  defineDecisionWithReasoning,
} from "../model/promptSegments";
import { exclude } from "../utils/utils";

// TODO: explicitly say whether or not the vote can tie based on the number of voters
// if it can tie then warn them another tie will lead to deadlock
// if it cannot possibly tie, say that too.

interface TiebreakerInfo {
  infotext: string;
  vote_candidates: string[];
}

export async function castVote(
  _hero: PrivateInformation,
  cast: Cast,
  msgs: ChatArchive,
  tiebreakerContext?: TiebreakerInfo
): Promise<DecisionWithReasoning> {
  const hero = getPrivateInformation(_hero);
  const heroModel = cast[hero.name].brain.model;
  const villains = exclude(cast, [hero]);

  const prompt = `${introduceHero(hero)}
  The time has come to vote somebody out of the game.
  Based on your conversations you had in this round and your thoughts on the other players, who will you vote for?
  Keep in mind that throwing a random vote is likely to waste your vote and achieve nothing: you should try to vote for someone who you both want eliminated, and believe other players will vote for too.
  ${introduceFirstImpressions(hero, heroModel)}
  Here is your list of private 1-on-1 chatlogs with the other players in the game:
  ${textifyMessageHistories(msgs.getManyChatlogs(hero.name, villains))}
  ${thinkAs(hero)}
  ${defineDecisionWithReasoning}
  `;
  const raw_result = await fetchData(
    prompt,
    getDecisionsWithReasoning(villains, 1)
  );
  const result = JSON.parse(raw_result);
  console.log(hero.name, result);
  return result;
}
