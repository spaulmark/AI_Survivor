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

  // Now we need to detect initial problems
  for (const character of cast) {
    const problems: OpinionProblem[] = detectOpinionProblems(
      character.brain.thoughts
    );
    // console.log(character.name, problems);
    const something = await fixOpinionProblems(
      problems,
      character,
      character.brain.thoughts
    );
  }

  // then after that, it's time to

  console.log(JSON.stringify(cast, null, 2));

  process.exit();
  // and initial problem detection / error correction within first impressions.

  // After that, initial generation of the problem queue, message budget, and then its off to the races
}

async function fixOver2Targets(
  character: PrivateInformation,
  thoughts: Thought[]
): Promise<[Thought, Thought]> {
  // TODO: shuffle it to reduce the impact of first/last item bias?
  // FIXME: should probably include some validation for this.
  const options: Thought[] = thoughts.filter(
    (thought) => thought.intent === "Target"
  );

  const getPrompt = (options: Thought[]) => `You are ${JSON.stringify(
    character,
    null,
    2
  )}, and you are playing Survivor.

You currently intend to eliminate too many players at once. Based on ${
    character.name
  }'s personality, select the character they would like to eliminate from the game more than all the rest, and justify why ${
    character.name
  } would prefer to eliminate that character above any other in two sentences or less. 

Options:
${JSON.stringify(options, null, 2)}

Reply in the following format:
[{
"decision": "",
"reasoning": ""
}]

Response: `;
  const firstResult: { decision: string; reasoning: string } = JSON.parse(
    await fetchData(getPrompt(options), { stop: ["]"], tokenlimit: 300 })
  )[0];

  const options2 = options.filter(
    (option) => option.name !== firstResult.decision
  );
  const secondResult: { decision: string; reasoning: string } = JSON.parse(
    await fetchData(getPrompt(options2), { stop: ["]"], tokenlimit: 300 })
  )[0];

  const finalResult = options.filter(
    (thought) =>
      thought.name === firstResult.decision ||
      thought.name === secondResult.decision
  );

  return [finalResult[0], finalResult[1]];
}

async function fixOpinionProblems(
  problems: OpinionProblem[],
  hero: PrivateInformation,
  thoughts: Thought[]
) {
  console.log(hero.name, problems);
  for (const problem of problems) {
    if (problem === OpinionProblem.OVER_2_TARGETS) {
      const solution = await fixOver2Targets(
        getPrivateInformation(hero),
        thoughts
      );
      for (const thought of thoughts) {
        if (
          thought.intent === "Target" &&
          solution[0].name !== thought.name &&
          solution[1].name !== thought.name
        )
          thought.intent = "Dislike";
      }
    }
  }
}

function detectOpinionProblems(thoughts: Thought[]): OpinionProblem[] {
  let targets = 0;
  let liked_or_ally = 0;
  let disliked_or_targeted = 0;
  let total_people = thoughts.length;
  let majority = Math.floor((total_people + 1) / 2) + 1; // total_people + 1 because you always "ally" yourself, and you are not counted in thoughts abt others
  for (const thought of thoughts) {
    thought.intent === "Target" && targets++ && disliked_or_targeted++;
    thought.intent === "Dislike" && disliked_or_targeted++;
    (thought.intent === "Ally" || thought.intent === "Like") && liked_or_ally++;
  }
  const problems: OpinionProblem[] = [];
  if (liked_or_ally === thoughts.length)
    problems.push(OpinionProblem.ALL_LIKED);
  if (targets > 2) problems.push(OpinionProblem.OVER_2_TARGETS);
  if (disliked_or_targeted >= majority)
    problems.push(OpinionProblem.LIKES_LESS_THAN_MAJORITY);
  return problems;
}

interface Thought {
  thoughts: string;
  intent: Intent;
  name: string;
}

enum OpinionProblem {
  OVER_2_TARGETS = "OVER_2_TARGETS",
  ALL_LIKED = "ZERO_TARGETS",
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
  thoughts: Thought
): Promise<Intent> {
  const prompt = `Survivor is a game where you have to form opinions on others, make alliances and vote people out.

This is someone's private thought about ${thoughts.name}.

${JSON.stringify(thoughts)} 

Which action option matches the private thoughts about the above character? 

List of action options:

Ally - I have a very good first impression, I will prioritize forming an alliance with this character.
Like - This character seems useful to me and my objectives in some way, either as a potential ally or a pawn. 
Neutral - I can't tell if this character is a help or harm to me and my objectives, I plan to observe them.
Dislike - I do not have any plans including this character, and they may be an obstacle to me. 
Target - This character is a threat/obstacle to me or my objectives. I want them eliminated soon.

Your response should be a single word. One of: Ally/Like/Neutral/Dislike/Target

RESPONSE: 
`;
  const isValidIntent = (intent: string): intent is Intent =>
    validIntents.has(intent.trim());
  let result;
  result = await retry3times(
    () => fetchData(prompt, { tokenlimit: 2 }),
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
    () => fetchData(prompt, { stop: ["]"] }),
    isValidJson,
    `generateFirstImpressions prompt did not generate valid json for ${hero.name}`
  );
  return result;
}

main();
