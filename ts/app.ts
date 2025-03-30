import * as dotenv from "dotenv";
import fs from "fs";
import { getPrivateInformation } from "./model/character";
import { getAllCurrentThoughts, PlayerModel } from "./model/thought";
import { generateDisjointFirstImpressions } from "./firstImpressions";
import {
  detectOpinionProblems,
  fixOpinionProblems,
  OpinionProblem,
} from "./problems/opinionProblems";
import { breakFirstImpressionTies, sortArrayWithLLM } from "./LLM/asyncSort";
import { ChatArchive } from "./model/chatArchive";

interface CastMember {
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

async function main() {
  const chatArchive = new ChatArchive();

  const cast = JSON.parse(
    fs.readFileSync("../characters.json", "utf-8")
  ) as CastMember[];

  const publicCast = [];
  // public cast generation
  for (const character of cast) {
    publicCast.push({
      name: character.name,
      appearance: character.appearance,
      introduction: character.introduction,
    });
  }

  // First impressions generation
  for (const hero of cast) {
    if (!hero.brain || !hero.brain.model) {
      const initialThoughts = await generateDisjointFirstImpressions(
        hero,
        publicCast
      );

      const newModel: PlayerModel = {};
      for (const thought of initialThoughts) {
        if (thought.name !== hero.name) {
          newModel[thought.name] = {
            my_thoughts: [{ thought, time: chatArchive.getCurrentTime() }],
            their_thoughts: {},
          };
        }
      }
      hero["brain"] = { model: newModel, ranking: [] };
    }
  }

  // Detect & fix opinion problems
  for (const character of cast) {
    const problems: OpinionProblem[] = detectOpinionProblems(
      getAllCurrentThoughts(character.brain.model)
    );
    // TODO: important: this is wrong.fixing an opinion problem means you need to append the thought history
    await fixOpinionProblems(
      problems,
      character,
      getAllCurrentThoughts(character.brain.model)
    );
  }
  // ranking from most liked to least liked is generated.
  for (const hero of cast) {
    if (!hero.brain.ranking) {
      hero.brain.ranking = [];
    }
    if (hero.brain.ranking.length === 0) {
      const result = await sortArrayWithLLM(
        getAllCurrentThoughts(hero.brain.model),
        breakFirstImpressionTies(getPrivateInformation(hero))
      );
      hero.brain.ranking = result.map((thought) => thought.name);
    }
  }

  // TODO: if you import the chat archive you might not want to do this.
  chatArchive.increaseMessageCount(); // do this to set messages from 0 to 1, this distinguishes between pregame and game start.

  // TODO: initial generation of the problem queue, message budget, and then its time to send messages

  // final state of the game when the program exits. TODO: may want to dump this and chat history on rate limit crash.
  fs.writeFileSync(
    "output-characters.json",
    JSON.stringify(cast, null, 2),
    "utf-8"
  );
}

dotenv.config();
main();
