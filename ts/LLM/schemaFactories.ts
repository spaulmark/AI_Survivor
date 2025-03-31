import {
  Schema,
  ArraySchema,
  SchemaType,
  StringSchema,
  ObjectSchema,
} from "@google/generative-ai";
import { Thought } from "../model/thought";
import { isThought } from "../model/thought";
import { validIntents } from "../model/Intent";

export function getDecisionsWithReasoning(
  choices: string[] | Thought[],
  howManytoChoose: number
): Schema {
  let finalChoices: string[];

  if (isThought(choices)) {
    finalChoices = choices.map((x: Thought) => x.name);
  } else {
    finalChoices = choices;
  }

  const schema: ArraySchema = {
    type: SchemaType.ARRAY,
    minItems: howManytoChoose,
    maxItems: howManytoChoose,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        decision: { type: SchemaType.STRING, enum: finalChoices },
        reasoning: { type: SchemaType.STRING },
      },
    },
  };
  return schema;
}

export interface BasicResponse {
  response: string;
}

export const basicResponseSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    response: {
      type: SchemaType.STRING,
    },
  },
  required: ["response"],
};

export const intentSchema: StringSchema = {
  type: SchemaType.STRING,
  enum: Array.from(validIntents),
};

export function firstImpressionsSchema(characterNames: string[]): ObjectSchema {
  const props: any = {};
  for (const name of characterNames) {
    props[name] = { type: SchemaType.STRING };
  }

  return {
    type: SchemaType.OBJECT,
    properties: { ...props },
    required: characterNames,
  };
}
