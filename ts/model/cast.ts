import { PlayerModel } from "./thought";

export interface CastMember {
  name: string;
  appearance: string;
  introduction: string;
  personality: string;
  strategy: string;
  initialGoal: string;
  brain: {
    ranking: string[];
    model: PlayerModel;
  };
}

export interface Cast {
  [name: string]: CastMember;
}
