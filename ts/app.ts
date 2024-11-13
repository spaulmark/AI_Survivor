import fs from "fs";
import { fetchData, isValidJson, retry3times } from "./LLM";

const validIntents = new Set(["Ally", "Like", "Neutral", "Dislike", "Target"]);

type Intent = "Ally" | "Like" | "Neutral" | "Dislike" | "Target";

////////////////////////////////////// app goes here. lol sorry. ///////////////////////////

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
  for (const character of cast) {
    if (!character.brain || !character.brain.thoughts) {
      const initialThoughts = await generateFirstImpressions(
        character,
        publicCast
      );
      character["brain"] = { thoughts: [] };
      character.brain.thoughts = JSON.parse(initialThoughts);
    }

    // now that we know that thoughts are generated, generate intents
    for (
      let thoughtIndex = 0;
      thoughtIndex < character.brain.thoughts.length;
      thoughtIndex++
    ) {
      if (character.brain.thoughts[thoughtIndex]["intent"]) continue;
      character.brain.thoughts[thoughtIndex]["intent"] = await thoughtsToIntent(
        getPrivateInformation(character),
        character.brain.thoughts[thoughtIndex].thoughts
      );
    }
  }

  // Now we need to detect initial problems
  for (const character of cast) {
    const problems: Problem[] = detectOpinionProblems(character.brain.thoughts);
    console.log(character.name, problems);
  }

  // then after that, it's time to

  // console.log(JSON.stringify(cast, null, 2));

  process.exit();
  // and initial problem detection / error correction within first impressions.

  // After that, initial generation of the problem queue, message budget, and then its off to the races

  // and write them to a file for caching
}

function detectOpinionProblems(
  thoughts: [{ thoughts: string; intent: Intent }]
): Problem[] {
  let targets = 0;
  let disliked_or_targeted = 0;
  let total_people = thoughts.length;
  let majority = Math.floor((total_people + 1) / 2) + 1; // total_people + 1 because you always "ally" yourself, and you are not counted in thoughts abt others
  for (const thought of thoughts) {
    thought.intent === "Target" && targets++ && disliked_or_targeted++;
    thought.intent === "Dislike" && disliked_or_targeted++;
  }
  const problems: Problem[] = [];
  if (targets === 0) problems.push(Problem.ZERO_TARGETS);
  if (targets > 2) problems.push(Problem.OVER_2_TARGETS);
  if (disliked_or_targeted >= majority)
    problems.push(Problem.LIKES_LESS_THAN_MAJORITY);
  return problems;
}

enum Problem {
  OVER_2_TARGETS = "OVER_2_TARGETS",
  ZERO_TARGETS = "ZERO_TARGETS",
  LIKES_LESS_THAN_MAJORITY = "LIKES_LESS_THAN_MAJORITY",
}

interface PrivateInformation {
  name: string;
  appearance: string;
  personality: string;
  initialGoal: string;
}

interface PublicInformation {
  name: string;
  appearance: string;
}

function getPrivateInformation(character: PrivateInformation) {
  return {
    name: character.name,
    appearance: character.appearance,
    personality: character.personality,
    initialGoal: character.initialGoal,
  };
}

async function thoughtsToIntent(
  hero: PrivateInformation,
  thoughts: { name: any }
): Promise<Intent> {
  console.log(`thoughts to intent`, hero.name, thoughts.name);
  const prompt = `Survivor is a game where you have to form opinions on others, make alliances and vote people out.

This is someone's private thought about ${thoughts.name}.

${JSON.stringify(thoughts)} 

Which action option matches the private thoughts about the above character? 

List of action options:

Ally - I have a very good first impression, I will prioritize forming an alliance with this character.
Like - I have a good first impression, I plan to talk to them and see if we can become allies.
Neutral - I don't feel strongly about this character, I will not prioritize talking to them.
Dislike - I have a poor first impression, I probably don't want to ally with this character.
Target - I have a bad first impression, I probably want to vote this character out in the near future.

Your response should be a single word. One of: Ally/Like/Neutral/Dislike/Target

RESPONSE: 
`;
  const isValidIntent = (intent: string): intent is Intent =>
    intent.trim() in validIntents;

  let result;
  result = await retry3times(
    () => fetchData(prompt, 2),
    isValidIntent,
    `thoughtsToIntent prompt did not generate a valid intent for ${hero.name}`
  );
  return result.trim();
}

async function generateFirstImpressions(
  hero: PrivateInformation,
  villains: PublicInformation[]
) {
  console.log(`Generating first impressions for ${hero.name}`);
  const others = [];
  for (const villain of villains) {
    if (villain.name === hero.name) continue;
    others.push(villain);
  }
  const prompt = `
  ${hero.name} is playing Survivor.
  ${JSON.stringify(hero)}
  Give a short 1-2 sentence first impression of each of the following characters in the context of ${
    hero.name
  }'s initial goal.

  Format these thoughts in the following way. All text returned should be inside of the [ ].
  [
  "character_name": {
  "thoughts": "my thoughts"
  },
  ]
  ${JSON.stringify(others, null, 2)}
  `;
  let result;
  result = await retry3times(
    () => fetchData(prompt),
    isValidJson,
    `generateFirstImpressions prompt did not generate valid json for ${hero.name}`
  );
  return result;
}

main();
