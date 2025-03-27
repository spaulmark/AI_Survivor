import { fetchData } from "./LLM_google";
import { getDecisionsWithReasoning } from "./schemaFactories";
import {
  Intent,
  intentToNumber,
  PrivateInformation,
  Thought,
} from "../model/character";
import {
  defineDecisionWithReasoning,
  introduceHero,
} from "../model/promptSegments";

// Function to asynchronously sort an array using LLM for tie-breaking
export async function sortArrayWithLLM(
  arr: Thought[],
  llmCompare: (thoughtsA: Thought, thoughtsB: Thought) => Promise<number>
): Promise<Thought[]> {
  // Step 1: Synchronously sort by opinion first

  arr.sort((a, b) => intentToNumber[b.intent] - intentToNumber[a.intent]);

  // Step 2: Group elements that have the same opinion
  const groups = new Map<Intent, Thought[]>();
  for (const item of arr) {
    if (!groups.has(item.intent)) groups.set(item.intent, []);
    groups.get(item.intent)!.push(item);
  }

  // Step 3: Sort each opinion group asynchronously using LLM
  const sortedGroups = await Promise.all(
    [...groups.entries()].map(async ([opinion, items]) => {
      if (items.length > 1) {
        return {
          opinion,
          sortedItems: await sortGroupAsync(items, llmCompare),
        };
      }
      return { opinion, sortedItems: items };
    })
  );

  // Step 4: Flatten sorted groups back into a single array
  return sortedGroups.flatMap((group) => group.sortedItems);
}

// Function to asynchronously sort a group with the same opinion using LLM
async function sortGroupAsync(
  items: Thought[],
  llmCompare: (thoughtsA: Thought, thoughtsB: Thought) => Promise<number>
): Promise<Thought[]> {
  // Use a stable sorting algorithm that works with async comparisons
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const comparison = await llmCompare(items[i], items[j]);
      if (comparison > 0) {
        // Swap if needed
        [items[i], items[j]] = [items[j], items[i]];
      }
    }
  }
  return items;
}

export function breakFirstImpressionTies(
  hero: PrivateInformation
): (t1: Thought, t2: Thought) => Promise<number> {
  return async (t1: Thought, t2: Thought) => {
    const prompt = `
    ${introduceHero(hero)}
    Given their private thoughts about each character, which of these 2 characters does ${
      hero.name
    } have a better first impression of? Even if they seem equal, you must find something to justify one over the other.
    ${JSON.stringify(t1)}
    ${JSON.stringify(t2)}
    ${defineDecisionWithReasoning}`;
    const choice = JSON.parse(
      await fetchData(prompt, getDecisionsWithReasoning([t1, t2], 1))
    );
    if (choice.decision === t1.name) return 1;
    else return -1;
  };
}
