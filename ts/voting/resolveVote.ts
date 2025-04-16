import { ChatArchive } from "../messages/chatArchive";
import { Cast } from "../model/cast";
import { exclude, listNames } from "../utils/utils";
import { castVotes } from "./castVote";
import { VotingRecord } from "./voteModel";
import { VoteCount, VotingResult } from "./voteModel";

export async function resolveVote(
  cast: Cast,
  msgs: ChatArchive,
  initialVote: VoteCount,
  voteRecords: VotingRecord[]
): Promise<VotingResult> {
  const voteCounts: VoteCount[] = [initialVote];
  let rocks = false;
  const pplwMostVotes = getHighestEntries(initialVote);
  let startingVoteTieSize = pplwMostVotes.length;
  // happy path: vote is not tied
  if (startingVoteTieSize === 1) {
    return { victim: pplwMostVotes[0], voteCounts, voteRecords, rocks };
  }
  // unhappy path: vote is tied
  // cast another vote, tied people cannot vote if there are 2 of them.
  let nonVoters = startingVoteTieSize === 2 ? pplwMostVotes : [];
  let tiedPlayers = pplwMostVotes;
  const castSize = Object.entries(cast).length;

  while (true) {
    // GET TIEBREAKER CONTEXT:
    const numVoters = castSize - nonVoters.length;
    const voteCouldTie = numVoters % startingVoteTieSize === 0;

    const infotextGenerator = (hero: string): string => {
      let infotext = `The previous vote resulted in a tie. The vote count was ${JSON.stringify(
        voteCounts.at(-1)
      )}, and no one was eliminated.
A revote will take place, and you may only vote for ${tiedPlayers}
In the previous vote, you voted for ${voteRecords.at(-1)![hero]}.
`;
      // If the vote cannot tie, say "You are free to vote who you prefer without worrying about a tie"
      // If the vote is between 2 people, say that if the vote ties again rocks fall everyone dies
      // If the vote is between more than X > 2 people, say if the vote ties X-ways then rocks fall everyone dies.
      if (!voteCouldTie) {
        infotext +=
          "Based on the number of people voting, it is not possible for this tiebreaker vote to deadlock, so you are free to vote for whoever you prefer to see eliminated.";
      } else if (startingVoteTieSize === 2) {
        infotext += `${listNames(
          tiedPlayers
        )} will not vote. Because there are an even number of voters, this revote could tie. If this revote ties, ${listNames(
          tiedPlayers
        )} will be immune, and one of the voters will be randomly eliminated by rock draw. Consider your vote carefully.`;
      } else {
        infotext += `Everyone will revote. If the revote ties between exactly ${startingVoteTieSize}, the vote will be considered deadlocked and someone will be eliminated randomly by rock draw. If the revote ties between less than ${startingVoteTieSize} players, another revote will be held between tied players. Consider your vote carefully.`;
      }
      return infotext;
    };

    const revote = await castVotes(cast, msgs, nonVoters, {
      infotext: infotextGenerator,
      tiedPlayers,
    });
    voteCounts.push(revote.voteCount);
    voteRecords.push(revote.votingRecord);
    const pplwMostRevotes = getHighestEntries(revote.voteCount);
    const revoteTieSize = pplwMostRevotes.length;
    // if revote is untied, spit out a result.
    if (revoteTieSize === 1) {
      return {
        victim: pplwMostRevotes[0],
        voteCounts: voteCounts,
        rocks,
        voteRecords,
      };
    } else if (revoteTieSize === startingVoteTieSize) {
      // if the vote is tied in the same way, go to rocks.
      rocks = true;
      const rockVictims = exclude(cast, pplwMostRevotes);
      const victim =
        rockVictims[Math.floor(Math.random() * rockVictims.length)];
      return { victim, voteCounts: voteCounts, rocks, voteRecords };
    } else {
      // if the vote is tied in a different way, do another revote between the new tie.
      startingVoteTieSize = revoteTieSize;
      nonVoters = startingVoteTieSize === 2 ? pplwMostRevotes : [];
      tiedPlayers = pplwMostRevotes;
    }
  }
}

function getHighestEntries(votes: VoteCount): string[] {
  return Object.entries(votes)
    .filter(([_, count]) => count === Math.max(...Object.values(votes)))
    .map(([name]) => name);
}
