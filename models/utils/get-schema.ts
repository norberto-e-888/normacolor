import mongoose, { SchemaDefinition, SchemaOptions } from "mongoose";
import { BaseModel } from "./base-model";
import { getToObject } from "./get-schema-options";

export const getSchema = <M extends BaseModel>(
  definition: SchemaDefinition<M>,
  options: SchemaOptions<M> & {
    omitFromTransform?: (keyof M)[];
  } = {}
) => {
  const { omitFromTransform, ...optionsRest } = options;

  return new mongoose.Schema(definition, {
    ...(optionsRest as SchemaOptions<M>),
    id: true,
    timestamps: true,
    toObject: getToObject(omitFromTransform),
  });
};
