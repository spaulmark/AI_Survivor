const fs = require("fs");

const validIntents = new Set(["Ally", "Like", "Neutral", "Dislike", "Target"]);

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
  for (character of cast) {
    publicCast.push({
      name: character.name,
      appearance: character.appearance,
      introduction: character.introduction,
    });
  }

  // First impressions generation
  for (character of cast) {
    if (!character.brain || !character.brain.thoughts) {
      const initialThoughts = await generateFirstImpressions(
        character,
        publicCast
      );
      character["brain"] = { thoughts: [] };
      character.brain.thoughts = JSON.parse(initialThoughts);
    }
    // now that we know that thoughts are generated, generate intents
    for (thought of character.brain.thoughts) {
      let thoughtIndex = 0;
      //TODO: this is not writing properly. probably need to go by index or something
      character.brain.thoughts[thoughtIndex]["intent"] = "hey dude";
      console.log(character.brain.thoughts[thoughtIndex]);

      // await thoughtsToIntent(
      //   getImportantPartsFromCharacterToIntrospect(character),
      //   thought
      // );
      thoughtIndex++;
      break; // TODO: no
    }
    console.log(character.brain.thoughts);
    break; // TODO: no
  }

  process.exit();
  // Next step: the like/dislike/ally annotation next to the first impressions,
  // and initial problem detection / error correction within first impressions.

  // After that, initial generation of the problem queue, message budget, and then its off to the races

  // and write them to a file for caching

  // console.log(JSON.stringify(cast, null, 2)); TODO: uncomment
}

function getImportantPartsFromCharacterToIntrospect(character) {
  return {
    name: character.name,
    appearance: character.appearance,
    personality: character.personality,
    initialGoal: character.initialGoal,
  };
}

async function thoughtsToIntent(hero, thoughts) {
  console.log(`thoughts to intent`, hero, thoughts);
  const prompt = `You are ${JSON.stringify(hero, null, 2)}

You have met ${
    thoughts.name
  } for the first time and you are playing survivor, a game where you have to form alliances and vote people out.

${JSON.stringify(thoughts)} 

Which action option matches your private thoughts about the following character? 

List of action options:

Ally - I have a very good first impression, I will prioritize forming an alliance with this character.
Like - I have a good first impression, I plan to talk to them and see if we can become allies.
Neutral - I don't feel strongly about this character, I will not prioritize talking to them.
Dislike - I have a poor first impression, I probably don't want to ally with this character.
Target - I have a bad first impression, I probably want to vote this character out.

Your response should be a single word. One of: Ally/Like/Neutral/Dislike/Target

RESPONSE: 
`;
  // const isValidOption = (option) => validIntents.has(option.trim());
  const isValidOption = () => true; // TODO: no, fix this lol

  // TODO: we need a custom grammar for this prompt, and the other one too
  let result;
  result = await retry3times(
    () => fetchData(prompt, (tokenlimit = 2)),
    isValidOption,
    `thoughtsToIntent prompt did not generate a valid intent for ${hero.name}`
  );
  return result.trim();
}

async function generateFirstImpressions(hero, villains) {
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

async function retry3times(func, validator, error) {
  for (let i = 0; i < 3; i++) {
    let result = await func();
    if (validator(result)) return result;
    console.error(`Failed attempt ${i + 1}/3 for ${error}`);
    await sleep(1000);
  }
  console.error(error);
  throw new Error(error);
}

async function fetchData(prompt, tokenlimit) {
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch("http://localhost:5001/api/v1/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          max_context_length: 4096,
          max_length: tokenlimit || 1024,
          prompt,
          quiet: false,
          rep_pen: 1.07,
          rep_pen_range: 256,
          rep_pen_slope: 1,
          temperature: 0.5,
          tfs: 1,
          top_a: 0,
          top_k: 100,
          top_p: 0.9,
          typical: 1,
        }),
      });
      if (!response.ok) {
        console.log(response);
        throw new Error("Network response was not ok");
      }
      const data = await response.json(); // Parse the JSON from the response

      if (data["error"] && data["error"]["code"] === 429) {
        throw new Error("it was 429");
      }
      return data["results"][0]["text"];
    } catch (error) {
      console.error("Error occured in fetchData:", error);
      await sleep(2000);
    }
  }
  throw new Error("Fetching prompt failed 3 times in a row");
}

function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

function sleep(ms) {
  console.log(`Sleeping ${ms}ms`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main();
