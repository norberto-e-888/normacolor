import mongoose, { Model } from "mongoose";

import { BaseModel, getSchema, ModelName } from "@/utils";

export type Art = {
  freepikId: number;
  type: string;
  images: {
    front: string;
    back: string;
  };
  dimensions: {
    x: number;
    y: number;
  };
} & BaseModel;

const artSchema = getSchema<Art>({
  freepikId: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  images: {
    type: new mongoose.Schema<Art["images"]>(
      {
        front: {
          type: String,
          required: true,
        },
        back: {
          type: String,
          required: true,
        },
      },
      { _id: false }
    ),
    required: true,
  },
  dimensions: {
    type: new mongoose.Schema<Art["dimensions"]>(
      {
        x: {
          type: Number,
          required: true,
        },
        y: {
          type: Number,
          required: true,
        },
      },
      { _id: false }
    ),
    required: true,
  },
});

export const Art: Model<Art> =
  mongoose.models?.Art || mongoose.model(ModelName.Art, artSchema);
