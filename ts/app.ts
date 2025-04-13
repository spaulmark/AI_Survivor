import * as dotenv from "dotenv";
import fs from "fs";
import { getPrivateInformation, getPublicInformation } from "./model/character";
import { getAllCurrentThoughts, PlayerModel } from "./model/thought";
import { generateDisjointFirstImpressions } from "./firstImpressions";
import { breakFirstImpressionTies, sortArrayWithLLM } from "./LLM/asyncSort";
import { ChatArchive } from "./messages/chatArchive";
import { initializeProblems } from "./problems/ingameProblem/problemId";
import {
  OpinionProblem,
  detectOpinionProblems,
  fixOpinionProblems,
} from "./problems/opinionProblem/opinionProblems";
import { ProblemQueue } from "./problems/problemQueue";
import { detectIngameProblems } from "./problems/ingameProblem/detectIngameProblems";
import { generateMessage } from "./messages/sendMessage";
import { Cast } from "./model/cast";

async function main() {
  initializeProblems();
  const msgs = new ChatArchive();

  const cast = JSON.parse(
    fs.readFileSync("../characters.json", "utf-8")
  ) as Cast;

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

  // initialize the problem queues.
  const problemQueues: { [id: string]: ProblemQueue } = {};
  for (const hero of Object.values(cast)) {
    problemQueues[hero.name] = new ProblemQueue(exclude(cast, [hero]));
  }

  msgs.increaseMessageCount(); // do this to set messages from 0 to 1, this distinguishes between pregame and game start.

  const message_budget = Object.values(cast).length; // TODO: give people more messages

  // detect problems and add them to the problem queue.
  for (const hero of Object.values(cast)) {
    const problems = detectIngameProblems(hero, hero.brain.ranking, msgs); // FIXME: hero.brain.ranking may become innacurate after tribeswaps.
    for (const problem of problems) {
      problemQueues[hero.name].addProblem(problem);
    }
  }

  // TODO: maybe re-rank and reevaluate thoughts periodically so things dont get stale?

  while (msgs.getCurrentTime().current_message < message_budget) {
    // all players get to send a message to solve their highest priority problem,
    // along with anything else they wanted to say to that player.
    const messagesUntilVote =
      message_budget - msgs.getCurrentTime().current_message;
    for (const hero of Object.values(cast)) {
      // TODO: check if empty, if empty go full auto.
      const msgInstructions = problemQueues[hero.name].pop();
      // TODO: for full auto mode, an extra step where the AI decides which conversation they want to continue and what they want to say
      const villain = msgInstructions.name;

      const otherMessages = msgs.getManyChatlogs(
        hero.name,
        exclude(cast, [hero, msgInstructions])
      );

      const message = await generateMessage(
        hero,
        getPublicInformation(cast[villain]),
        hero.brain.model,
        msgInstructions.msgsToSend,
        msgs.getChatlog(hero.name, villain),
        otherMessages,
        messagesUntilVote
      );
      console.log(`${hero.name} -> ${villain} |`, message);
      msgs.addMessage({
        from: hero.name,
        to: villain,
        text: message,
        time: msgs.getCurrentTime(),
      });
    }
    msgs.increaseMessageCount();
  }

  // final state of the game when the program exits.
  // TODO: may want to dump this and chat history on rate limit crash.
  fs.writeFileSync(
    "output-characters.json",
    JSON.stringify(cast, null, 2),
    "utf-8"
  );
  fs.writeFileSync(
    "output-chatlogs.json",
    JSON.stringify(msgs.export(), null, 2)
  );
}

dotenv.config();
main();

function exclude(cast: Cast, _exclusions: { name: string }[]) {
  const exclusions = new Set(_exclusions.map((x) => x.name));
  return Object.values(cast)
    .filter((x) => !exclusions.has(x.name))
    .map((x) => x.name);
}
