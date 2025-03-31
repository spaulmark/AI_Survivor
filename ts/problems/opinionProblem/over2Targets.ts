import { fetchData } from "../../LLM/LLM_google";
import { getDecisionsWithReasoning } from "../../LLM/schemaFactories";
import {
  PrivateInformation,
  DecisionWithReasoning,
} from "../../model/character";
import { Thought } from "../../model/thought";

export async function fixOver2Targets(
  character: PrivateInformation,
  thoughts: Thought[]
): Promise<[Thought, Thought]> {
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
`;
  const firstResult: DecisionWithReasoning = JSON.parse(
    await fetchData(
      getPrompt(options),
      getDecisionsWithReasoning(
        ((x: Thought[]) => x.map((x) => x.name))(options),
        2
      )
    )
  )[0];

  const options2 = options.filter(
    (option) => option.name !== firstResult.decision
  );
  const secondResult: DecisionWithReasoning = JSON.parse(
    await fetchData(
      getPrompt(options2),
      getDecisionsWithReasoning(
        ((x: Thought[]) => x.map((x) => x.name))(options),
        2
      )
    )
  )[0];

  const finalResult = options.filter(
    (thought) =>
      thought.name === firstResult.decision ||
      thought.name === secondResult.decision
  );

  return [finalResult[0], finalResult[1]];
}
