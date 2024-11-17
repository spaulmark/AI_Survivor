import { fetchData } from "../LLM";
import { PrivateInformation, Thought } from "../model/character";

export async function fixOver2Targets(
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
