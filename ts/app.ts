import * as dotenv from "dotenv";
import fs from "fs";
import { getPrivateInformation, Thought } from "./model/character";
import {
  generateDisjointFirstImpressions,
  thoughtsToIntent,
} from "./firstImpressions";
import {
  detectOpinionProblems,
  fixOpinionProblems,
  OpinionProblem,
} from "./problems/opinionProblems";
import { fetchData } from "./LLM/LLM_google";
import {
  firstImpressionsSchema,
  getDecisionsWithReasoning,
  intentSchema,
} from "./LLM/schemaFactories";

/*
  Cast format:
  [
      {
    "name": "",
    "appearance": "",
    "introduction": "",
    "personality": "",
    "strategy": "",
    "initialGoal": "",
    "brain": {
    "ranking": string[]
      "firstImpressions": [
        {
          "name": "",
          "thoughts": ""
        },
    },
  ]
  */

interface CastMember {
  name: string;
  appearance: string;
  introduction: string;
  personality: string;
  strategy: string;
  initialGoal: string;
  brain: {
    ranking?: string[];
    thoughts: Thought[];
  };
}

async function main() {
  // const result = await fetchData("Hey dude", intentSchema);
  // return 0;

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
    if (!hero.brain || !hero.brain.thoughts) {
      const initialThoughts = await generateDisjointFirstImpressions(
        hero,
        publicCast
      );
      hero["brain"] = { thoughts: [] };
      hero.brain.thoughts = initialThoughts;
    }
    // now that we know that thoughts are generated, generate any missing intents
    for (
      let thoughtIndex: number = 0;
      thoughtIndex < hero.brain.thoughts.length;
      thoughtIndex++
    ) {
      if (hero.brain.thoughts[thoughtIndex]["intent"]) continue;
      hero.brain.thoughts[thoughtIndex]["intent"] = await thoughtsToIntent(
        getPrivateInformation(hero),
        hero.brain.thoughts[thoughtIndex]
      );
    }
    // now that intents are generated, generate rankings.
    if (!hero.brain.ranking) {
      hero.brain.ranking = [];
    }
  }

  // Detect & fix opinion problems
  for (const character of cast) {
    const problems: OpinionProblem[] = detectOpinionProblems(
      character.brain.thoughts
    );
    await fixOpinionProblems(problems, character, character.brain.thoughts);
  }
  // FIXME: optional: make a new parameter: initial impression & current impression. (if i need to)
  // probably a good idea to tie this to history somehow, so you can see when impressions changed.

  console.log(JSON.stringify(cast, null, 2));

  // TODO: make the players rank how much they like each other initially.

  // After that, initial generation of the problem queue, message budget, and then its time to send messages
}

dotenv.config();
main();
