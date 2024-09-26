import { Document, SchemaOptions, ToObjectOptions } from "mongoose";
import { BaseModel } from "./base-model";

export const COMMON_SCHEMA_OPTIONS: SchemaOptions = {
  id: true,
  timestamps: true,
};

export const getToObject = <M extends BaseModel>(
  omitFromTransform: (keyof M)[] = []
): ToObjectOptions<Document<M>> => ({
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
});
