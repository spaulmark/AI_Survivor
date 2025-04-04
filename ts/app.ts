import * as dotenv from "dotenv";
import fs from "fs";
import { getPrivateInformation } from "./model/character";
import { getAllCurrentThoughts, PlayerModel } from "./model/thought";
import { generateDisjointFirstImpressions } from "./firstImpressions";

import { breakFirstImpressionTies, sortArrayWithLLM } from "./LLM/asyncSort";
import { ChatArchive } from "./model/chatArchive";
import { initializeProblems } from "./problems/ingameProblem/problemId";
import {
  OpinionProblem,
  detectOpinionProblems,
  fixOpinionProblems,
} from "./problems/opinionProblem/opinionProblems";
import { ProblemQueues } from "./problems/problemQueue";

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
  initializeProblems();
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
    await fixOpinionProblems(
      problems,
      character,
      character.brain.model,
      chatArchive.getCurrentTime()
    );
  }
  // ranking from most liked to least liked is generated.
  for (const hero of cast) {
    if (!hero.brain.ranking) {
      hero.brain.ranking = [];
    }
    if (hero.brain.ranking.length === 0) {
      console.log(`Creating intial rankings for ${hero.name}`);
      const result = await sortArrayWithLLM(
        getAllCurrentThoughts(hero.brain.model),
        breakFirstImpressionTies(getPrivateInformation(hero))
      );
      hero.brain.ranking = result.map((thought) => thought.name);
    }
  }

  // TODO: if you import the chat archive you might not want to do this.
  chatArchive.increaseMessageCount(); // do this to set messages from 0 to 1, this distinguishes between pregame and game start.

  const problemQueues = new ProblemQueues(cast.map((x) => x.name));

  const message_budget = 10 * cast.length; // for now you get 10 messages each to figure it out. good luck!

  // TODO: when solving the "player not contacted" problem, you might need to return "no op" because they actually sent you a message first.
  // then you move on to the next problem in the queue. interesting stuff

  // Also I think that there should be something like solution batching. It should look at all the solutions to all the problems and then
  // sort them by like, what needs to be done, and then deal with the highest priority problem but also if they have something else to say
  // to that person, they should add it in to their message just to be more efficent with their messaging.

  // TODO: detect problems for the problem queue.

  // TODO: then for all problems where the solution hasn't been computed yet, compute the solution and save it.

  // TODO: take the highest priority problem, figure out who we can send a message to to fix this and also maximize efficency of messaging.
  // the issue here is some problems might require us to send messages to multiple people. so you can break ties by looking ahead to
  // other lower priority problems in the problem queue. difficult.

  // final state of the game when the program exits. TODO: may want to dump this and chat history on rate limit crash.
  fs.writeFileSync(
    "output-characters.json",
    JSON.stringify(cast, null, 2),
    "utf-8"
  );
}

dotenv.config();
main();
