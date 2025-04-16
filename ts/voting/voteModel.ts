export type VoteCount = { [name: string]: number };

export interface VotingResult {
  victim: string;
  voteCounts: VoteCount[];
  voteRecords: VotingRecord[];
  rocks: boolean;
}
export interface VotingRecord {
  [voter: string]: string; // voter : guy he voted for
}
