import mongoose, { SchemaDefinition, SchemaOptions } from "mongoose";
import { BaseModel } from "./base-model";

export const getSchema = <M extends BaseModel>(
  definition: SchemaDefinition<M>,
  options: SchemaOptions<M> & {
    omitFromTransform?: (keyof M)[];
  } = {}
) => {
  const { omitFromTransform, ...optionsRest } = options;

  return new mongoose.Schema(definition, {
    ...optionsRest,
    id: true,
    timestamps: true,
    toObject: {
      virtuals: true,
      getters: true,
      transform: (_: unknown, ret: Record<string, unknown>) => ({
        ...ret,
        _id: undefined,
        __v: undefined,
        ...(omitFromTransform || []).reduce(
          (toOmit, keyToOmit) => ({
            ...toOmit,
            [keyToOmit]: undefined,
          }),
          {}
        ),
      }),
    },
  });
};
