import * as dotenv from "dotenv";
import fs from "fs";
import { getPrivateInformation, getPublicInformation } from "./model/character";
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
import { ProblemQueue } from "./problems/problemQueue";
import { detectIngameProblems } from "./problems/ingameProblem/detectIngameProblems";
import { generateMessage } from "./messages/sendMessage";

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

// a nice function to have for myself for backwards compatibility,
// but not used in the actual game.
function fixCastFormat(cast: CastMember[]) {
  const result: any = {};
  for (const c of cast) {
    result[c.name] = c;
  }

  fs.writeFileSync(
    "fixed-characters.json",
    JSON.stringify(cast, null, 2),
    "utf-8"
  );
}

async function main() {
  initializeProblems();
  const msgs = new ChatArchive();

  const cast = JSON.parse(fs.readFileSync("../characters.json", "utf-8")) as {
    [name: string]: CastMember;
  };

  for (const [name, _] of Object.entries(cast)) {
    cast[name].name = name;
  }

  const publicCast = [];
  // public cast generation
  for (const character of Object.values(cast)) {
    publicCast.push({
      name: character.name,
      appearance: character.appearance,
      introduction: character.introduction,
    });
  }

  // First impressions generation
  for (const hero of Object.values(cast)) {
    if (!hero.brain || !hero.brain.model) {
      const initialThoughts = await generateDisjointFirstImpressions(
        hero,
        publicCast
      );

      const newModel: PlayerModel = {};
      for (const thought of initialThoughts) {
        if (thought.name !== hero.name) {
          newModel[thought.name] = {
            my_thoughts: [{ thought, time: msgs.getCurrentTime() }],
            their_thoughts: {},
          };
        }
      }
      hero["brain"] = { model: newModel, ranking: [] };
    }
  }

  // Detect & fix opinion problems
  for (const character of Object.values(cast)) {
    const problems: OpinionProblem[] = detectOpinionProblems(
      getAllCurrentThoughts(character.brain.model)
    );
    await fixOpinionProblems(
      problems,
      character,
      character.brain.model,
      msgs.getCurrentTime()
    );
  }
  // ranking from most liked to least liked is generated.
  for (const hero of Object.values(cast)) {
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

  // FIXME: if you import the chat archive you might not want to do this.
  msgs.increaseMessageCount(); // do this to set messages from 0 to 1, this distinguishes between pregame and game start.

  const problemQueues: { [id: string]: ProblemQueue } = {};

  for (const hero of Object.values(cast)) {
    problemQueues[hero.name] = new ProblemQueue(
      Object.values(cast)
        .filter((x) => x.name !== hero.name)
        .map((x) => x.name)
    );
  }

  const message_budget = 9 * Object.values(cast).length; // random number

  // TODO: somehow do not detect redundant problems? maybe using a set? idk.
  // TODO: also need the ability to cancel problems if a plan gets cancelled.

  // detect problems and add them to the problem queue.
  for (const hero of Object.values(cast)) {
    const problems = detectIngameProblems(hero, hero.brain.ranking, msgs); // FIXME: hero.brain.ranking may become innacurate after tribeswaps.
    for (const problem of problems) {
      problemQueues[hero.name].addProblem(problem);
    }
  }
  // TODO: send a message to solve the highest priority problem.

  for (const hero of Object.values(cast)) {
    // send a message
    const msgInstructions = problemQueues[hero.name].pop(); // TODO: this is wrong lol, everyone is messaging the first one in the list.
    const villain = msgInstructions.name;
    const message = await generateMessage(
      hero,
      getPublicInformation(cast[villain]),
      hero.brain.model,
      msgInstructions.msgsToSend,
      [],
      msgs.getChatlog(hero.name, villain)
    );
    console.log(`${hero.name} -> ${villain} | `, message);
  }

  // final state of the game when the program exits. TODO: may want to dump this and chat history on rate limit crash.
  fs.writeFileSync(
    "output-characters.json",
    JSON.stringify(cast, null, 2),
    "utf-8"
  );
}

dotenv.config();
main();
