import { greetPlayer } from "../../messages/messageSegments";
import { ChatArchive } from "../../messages/chatArchive";
import { createProblem, Problem } from "./problemId";

export function detectPlayerNotContacted(
  hero: string,
  hero_ranking: string[],
  tribemates: string[],
  msgs: ChatArchive
): Problem[] {
  const result: Problem[] = [];
  for (const villain of tribemates) {
    if (msgs.getChatlog(hero, villain).length === 0) {
      result.push(
        createProblem("PLAYER_NOT_CONTACTED", -hero_ranking.indexOf(villain), {
          [villain]: greetPlayer(villain),
        })
      );
    }
  }
  return result;
}
