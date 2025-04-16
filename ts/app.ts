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
import { exclude } from "./utils/utils";
import { decideWhoToMessage } from "./messages/decideWhoToMessage";
import { resolveVote } from "./voting/resolveVote";
import { VotingResult } from "./voting/voteModel";
import { castVotes } from "./voting/castVote";

const characters_json_path = "../characters.json";
const input_chatlogs_path = "../input-chatlogs.json";

async function main() {
  initializeProblems();
  // init cast
  const cast = JSON.parse(
    fs.readFileSync(characters_json_path, "utf-8")
  ) as Cast;
  for (const [name, _] of Object.entries(cast)) {
    cast[name].name = name;
  }
  // init chat archive
  const msgs = new ChatArchive();
  if (fs.existsSync(input_chatlogs_path)) {
    const contents = fs.readFileSync(input_chatlogs_path, "utf8");
    msgs.import(JSON.parse(contents));
  }
  // just put everything in a try catch bro it prevents errors
  try {
    // TODO: big problem, there was a hallucination about who is in the game. we need to be very clear who is in the game.
    // ^^^^ this has happened twice now

    // TODO: your current history of plans is.... [save and list the plan history]

    // TODO: see the screenshot: sometimes characters do the exact opposite of what their plan says they should do. wtf?

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

    // initialize the problem queues.
    const problemQueues: { [id: string]: ProblemQueue } = {};
    for (const hero of Object.values(cast)) {
      problemQueues[hero.name] = new ProblemQueue(exclude(cast, [hero]));
    }

    msgs.getCurrentTime().current_message === 0 && msgs.increaseMessageCount();

    const message_budget = 18; // TODO: make it dynamic later idk.

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
        const msgInstructions = problemQueues[hero.name].isEmpty()
          ? await decideWhoToMessage(hero, cast, messagesUntilVote, msgs)
          : problemQueues[hero.name].pop();
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

    // when msg budget is exhausted, everyone casts a vote
    const actualVote = await castVotes(cast, msgs, []);
    console.log("------");
    const result: VotingResult = await resolveVote(
      cast,
      msgs,
      actualVote.voteCount,
      [actualVote.votingRecord]
    );
    console.log(JSON.stringify(result.voteCounts));

    // TODO: eliminate somebody, add infastructure for that, move on to the next round.
  } catch (error) {
    console.error(error);
    console.error("An unhandled exception caused the program to crash early.");
  }
  console.log("End of program. Dumping output files...");

  // analytics
  const final_messages = msgs.export().messages;
  for (const [hero, loopme] of Object.entries(final_messages)) {
    for (const [villain, msgs] of Object.entries(loopme)) {
      console.log(hero, villain, msgs.length);
    }
  }

  // final state of the game when the program exits.
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
