import fs from "fs";
import {
  getPrivateInformation,
  PrivateInformation,
  Thought,
} from "./model/character";
import { generateFirstImpressions, thoughtsToIntent } from "./firstImpressions";
import {
  detectOpinionProblems,
  fixOpinionProblems,
  OpinionProblem,
} from "./problems/opinionProblems";

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
      "firstImpressions": [
        {
          "name": "",
          "thoughts": ""
        },
    },
  ]
  */

async function main() {
  const cast = JSON.parse(fs.readFileSync("../characters.json", "utf-8"));

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
      const initialThoughts = await generateFirstImpressions(hero, publicCast);
      hero["brain"] = { thoughts: [] };
      hero.brain.thoughts = JSON.parse(initialThoughts);
    }

    // now that we know that thoughts are generated, generate intents
    for (
      let thoughtIndex = 0;
      thoughtIndex < hero.brain.thoughts.length;
      thoughtIndex++
    ) {
      if (hero.brain.thoughts[thoughtIndex]["intent"]) continue;
      hero.brain.thoughts[thoughtIndex]["intent"] = await thoughtsToIntent(
        getPrivateInformation(hero),
        hero.brain.thoughts[thoughtIndex]
      );
    }
  }

  // Detect & fix opinion problems
  for (const character of cast) {
    const problems: OpinionProblem[] = detectOpinionProblems(
      character.brain.thoughts
    );
    await fixOpinionProblems(problems, character, character.brain.thoughts);
  }

  console.log(JSON.stringify(cast, null, 2));
  // After that, initial generation of the problem queue, message budget, and then its time to send messages
}

main();
