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
import { shuffle } from "../utils";

export function getDecisionsWithReasoning(
  _choices: string[] | Thought[],
  howManytoChoose: number
): Schema {
  let finalChoices: string[];

  if (isThought(_choices)) {
    finalChoices = _choices.map((x: Thought) => x.name);
  } else {
    finalChoices = _choices;
  }
  const choices = shuffle(finalChoices);

  const items: any = {
    type: SchemaType.OBJECT,
    properties: {
      decision: { type: SchemaType.STRING, enum: choices },
      reasoning: { type: SchemaType.STRING },
    },
    required: ["reasoning", "decision"],
    propertyOrdering: ["reasoning", "decision"],
  };

  const schema: ArraySchema = {
    type: SchemaType.ARRAY,
    minItems: howManytoChoose,
    maxItems: howManytoChoose,
    items,
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
