import { ChatArchive } from "../messages/chatArchive";
import { Cast } from "../model/cast";
import { exclude } from "../utils/utils";

export type VoteCount = { [name: string]: number };

interface VotingResult {
  victim: string;
  revotes: VoteCount[];
  rocks: boolean;
}

export async function resolveVote(
  cast: Cast,
  initialVote: VoteCount,
  msgs: ChatArchive
): Promise<VotingResult> {
  const revotes: VoteCount[] = [];
  let rocks = false;
  const pplwMostVotes = getHighestEntries(initialVote);
  let originalVoteTieSize = pplwMostVotes.length;
  // happy path: vote is not tied
  if (originalVoteTieSize === 1) {
    return { victim: pplwMostVotes[0], revotes, rocks };
  }
  // unhappy path: vote is tied
  // cast another vote, tied people cannot vote.
  let validVoters = exclude(cast, pplwMostVotes);
  while (true) {
    const revote = fakeVote(validVoters);
    revotes.push(revote);
    const pplwMostRevotes = getHighestEntries(revote);
    const revoteTieSize = pplwMostRevotes.length;
    // if revote is untied, spit out a result.
    if (revoteTieSize === 1) {
      return { victim: pplwMostRevotes[0], revotes, rocks };
    } else if (revoteTieSize === originalVoteTieSize) {
      // if the vote is tied in the same way, go to rocks.
      rocks = true;
      const rockVictims = exclude(cast, pplwMostRevotes);
      const victim =
        rockVictims[Math.floor(Math.random() * rockVictims.length)];
      return { victim, revotes, rocks };
    } else {
      // if the vote is tied in a different way, do another revote between the new tie.
      originalVoteTieSize = revoteTieSize;
      validVoters = exclude(cast, pplwMostRevotes);
    }
  }
}

function getHighestEntries(votes: VoteCount): string[] {
  return Object.entries(votes)
    .filter(([_, count]) => count === Math.max(...Object.values(votes)))
    .map(([name]) => name);
}

let deleteme: number = 0;

function fakeVote(x: any): VoteCount {
  // reality is whatever i want it to be
  const result: VoteCount =
    deleteme === 0
      ? { Mishima: 3, Celine: 3, Cirno: 3 }
      : { Cirno: 3, Celine: 3 };
  deleteme++;
  return result;
}
