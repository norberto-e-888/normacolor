import mongoose, { Model } from "mongoose";

import {
  BaseModel,
  getSchema,
  isInteger,
  isPositive,
  ModelName,
} from "@/utils";

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
  editableFields: EditableField[];
} & BaseModel;

export type EditableField = {
  name: string;
  type: "image" | "text";
  defaultValue: {
    content: string;
    fontFamily?: string;
    fontSize?: string;
    fontColor?: string;
  };
  bounds: {
    height: number;
    width: number;
    top: number;
    left: number;
  };
} & (
  | {
      type: "image";
      defaultValue: {
        content: string;
        fontFamily?: undefined;
        fontSize?: undefined;
        fontColor?: undefined;
      };
    }
  | {
      type: "text";
      defaultValue: {
        content: string;
        fontFamily: string;
        fontSize: string;
        fontColor: string;
      };
    }
);

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
      new mongoose.Schema<EditableField>(
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
            type: new mongoose.Schema<EditableField["defaultValue"]>(
              {
                content: {
                  type: String,
                  required: true,
                },
                fontFamily: {
                  type: String,
                  required: function (this: Art) {
                    return this.type === "text";
                  },
                  set: function (this: Art) {
                    if (this.type === "image") {
                      return undefined;
                    }
                  },
                },
                fontSize: {
                  type: String,
                  required: function (this: Art) {
                    return this.type === "text";
                  },
                  set: function (this: Art) {
                    if (this.type === "image") {
                      return undefined;
                    }
                  },
                },
                fontColor: {
                  type: String,
                  required: function (this: Art) {
                    return this.type === "text";
                  },
                  set: function (this: Art) {
                    if (this.type === "image") {
                      return undefined;
                    }
                  },
                },
              },
              { _id: false }
            ),
          },
          bounds: new mongoose.Schema<EditableField["bounds"]>({
            height: {
              type: Number,
              required: true,
              validate: [isPositive(), isInteger()],
            },
            width: {
              type: Number,
              required: true,
              validate: [isPositive(), isInteger()],
            },
            top: {
              type: Number,
              required: true,
              validate: [isPositive(), isInteger()],
            },
            left: {
              type: Number,
              required: true,
              validate: [isPositive(), isInteger()],
            },
          }),
        },
        {
          _id: false,
        }
      ),
    ],
    required: true,
    default: [],
  },
});

export const Art: Model<Art> =
  mongoose.models?.Art || mongoose.model(ModelName.Art, artSchema);
