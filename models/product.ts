import mongoose, {
  CallbackWithoutResultAndOptionalError,
  Model,
} from "mongoose";
import { BaseModel, getSchema } from "./utils";

export interface Product extends BaseModel {
  name: string;
  price: number;
  images: string[];
  isPublic: boolean;
}

export const PRODUCT_MODEL_NAME = "Product";

const productSchema = getSchema<Product>({
  name: {
    type: String,
    required: true,
    unique: true,
    set: (value: string) =>
      value.trim().toLowerCase().split(" ").filter(Boolean).join(" "),
    minlength: 3,
  },
  price: {
    type: Number,
    isInteger: true,
    min: 1,
    set: (value: number) => Math.round(value),
  },
  images: {
    type: [String],
    required: true,
    default: [],
  },
  isPublic: {
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
});

export const Product: Model<Product> =
  mongoose.models.Product ||
  mongoose.model<Product>(PRODUCT_MODEL_NAME, productSchema);
