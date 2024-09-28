import mongoose, {
  CallbackWithoutResultAndOptionalError,
  Model,
} from "mongoose";

import { BaseModel, getSchema, ModelName, normalize, round } from "@/utils";

export interface Product extends BaseModel {
  name: string;
  price: number;
  images: string[];
  isPublic: boolean;
}

const productSchema = getSchema<Product>({
  name: {
    type: String,
    required: true,
    unique: true,
    set: normalize,
    minlength: 3,
  },
  price: {
    type: Number,
    required: true,
    isInteger: true,
    min: 1,
    set: round,
  },
  images: {
    type: [String],
    required: true,
    default: [],
  },
  isPublic: {
    type: Boolean,
    required: true,
    default: false,
  },
});

productSchema.pre(
  "save",
  function (this: Product, next: CallbackWithoutResultAndOptionalError) {
    if (!this.images.length) {
      this.isPublic = false;
    }

    next();
  }
);

productSchema.index({
  isPublic: 1,
  price: 1,
});

export const Product: Model<Product> =
  mongoose.models.Product ||
  mongoose.model<Product>(ModelName.Product, productSchema);
