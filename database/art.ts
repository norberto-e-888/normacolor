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
  editableFields: [
    {
      name: string;
      type: "image" | "text";
      defaultValue: {
        content: string;
        font?: string;
        fontSize?: string;
        fontColor?: string;
      };
    }
  ];
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
  editableFields: {
    type: [
      new mongoose.Schema<Art["editableFields"]["0"]>(
        {
          name: {
            type: String,
            required: true,
          },
          type: {
            type: String,
            required: true,
            enum: ["image", "text"],
          },
          defaultValue: {
            type: new mongoose.Schema<
              Art["editableFields"]["0"]["defaultValue"]
            >(
              {
                content: {
                  type: String,
                  required: true,
                },
                font: {
                  type: String,
                  required: function (this: Art["editableFields"]["0"]) {
                    return this.type === "text";
                  },
                },
                fontSize: {
                  type: String,
                  required: function (this: Art["editableFields"]["0"]) {
                    return this.type === "text";
                  },
                },
                fontColor: {
                  type: String,
                  required: function (this: Art["editableFields"]["0"]) {
                    return this.type === "text";
                  },
                },
              },
              { _id: false }
            ),
          },
        },
        {
          _id: false,
        }
      ),
    ],
  },
});

export const Art: Model<Art> =
  mongoose.models?.Art || mongoose.model(ModelName.Art, artSchema);
