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
  basicVotingInstructions,
  dontWasteYourVote,
} from "../model/promptSegments";
import { exclude, excludeStrings } from "../utils/utils";
import { VoteCount, VotingRecord } from "./voteModel";

interface TiebreakerInfo {
  infotext: (hero: string) => string;
  tiedPlayers: string[];
}

export async function castVotes(
  cast: Cast,
  msgs: ChatArchive,
  _nonVoters: string[],
  tiebreakerContext?: TiebreakerInfo
): Promise<{ voteCount: VoteCount; votingRecord: VotingRecord }> {
  const voteCount: VoteCount = {};
  const votingRecord: VotingRecord = {};
  const nonVoters = new Set(_nonVoters);
  for (const hero of Object.values(cast)) {
    if (nonVoters.has(hero.name)) continue;
    const vote = await castVote(hero, cast, msgs, tiebreakerContext);
    votingRecord[hero.name] = vote.decision;
    console.log(hero.name, vote);
    if (!voteCount[vote.decision]) {
      voteCount[vote.decision] = 1;
    } else {
      voteCount[vote.decision]++;
    }
  }
  return { voteCount, votingRecord };
}

export async function castVote(
  _hero: PrivateInformation,
  cast: Cast,
  msgs: ChatArchive,
  tiebreakerContext?: TiebreakerInfo
): Promise<DecisionWithReasoning> {
  const hero = getPrivateInformation(_hero);
  const heroModel = cast[hero.name].brain.model;
  const villains = tiebreakerContext
    ? excludeStrings(tiebreakerContext.tiedPlayers, [hero.name])
    : exclude(cast, [hero]);

  const extraContextText = tiebreakerContext
    ? tiebreakerContext.infotext(hero.name)
    : dontWasteYourVote;

  const prompt = `${introduceHero(hero)}
${basicVotingInstructions}
${extraContextText}
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
  const result = JSON.parse(raw_result)[0];
  return result;
}
