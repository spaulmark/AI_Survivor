import { CastMember } from "../../app";
import { ChatArchive } from "../../messages/chatArchive";
import { detectPlayerNotContacted } from "./playerNotContacted";
import { Problem } from "./problemId";

export function detectIngameProblems(
  hero: CastMember,
  tribemates: string[],
  msgs: ChatArchive
): Problem[] {
  let result: Problem[] = [];
  result = result.concat(
    detectPlayerNotContacted(hero.name, hero.brain.ranking, tribemates, msgs)
  );
  return result;
}
