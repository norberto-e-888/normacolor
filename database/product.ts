import mongoose, {
  CallbackWithoutResultAndOptionalError,
  Model,
} from "mongoose";

import {
  BaseModel,
  getSchema,
  isEnumArray,
  isExactLength,
  ModelName,
  normalize,
  round,
} from "@/utils";

export enum ProductOptionSides {
  One = "one",
  Both = "both",
  Diptic = "diptic",
  Triptic = "triptic",
}

export enum ProductOptionFinish {
  PlastifiedGloss = "plastifiedgloss",
  PlastifiedMatte = "plastifiedmatte",
  UVVarnish = "uvvarnish",
  None = "none",
}

export enum ProductOptionPaper {
  HundredLbMatte = "100lbmatte",
  HundredLbSatin = "100lbsatin",
  HundredThirtyLbMatte = "130lbmatte",
  HundredThirtyLbSatin = "130lbsatin",
  ThreeHundredGMatte = "300gmatte",
  ThreeHundredGSatin = "300gsatin",
  Chemical = "chemical",
  Bond = "bond",
  Bond20lb = "bond20lb",
}

export interface ProductOptions {
  sides?: [ProductOptionSides];
  finish?: [ProductOptionFinish];
  paper?: [ProductOptionPaper];
  dimensions?: [[number, number]];
}

export const productOptionsSchema = new mongoose.Schema<ProductOptions>(
  {
    sides: {
      type: [String],
      required: false,
      validate: [isEnumArray(ProductOptionSides)],
    },
    finish: {
      type: [String],
      required: false,
      validate: [isEnumArray(ProductOptionFinish)],
    },
    paper: {
      type: [String],
      required: false,
      validate: [isEnumArray(ProductOptionPaper)],
    },
    dimensions: {
      type: [[Number]],
      required: false,
      validate: [
        isExactLength(2),
        {
          validator: (dimensions: [[number, number]]) =>
            dimensions.every(
              ([x, y, ...rest]) =>
                Number.isInteger(x) &&
                x > 0 &&
                Number.isInteger(y) &&
                y > 0 &&
                rest.length === 0
            ),
          message:
            "Each dimension option must be of size 2 and include only positive integers",
        },
      ],
    },
  },
  { _id: false }
);

type PriceMap<K> = Map<K, number>;

export interface ProductOptionsPricing {
  sides?: PriceMap<ProductOptionSides>;
  finish?: PriceMap<ProductOptionFinish>;
  paper?: PriceMap<ProductOptionPaper>;
  dimensions?: {
    [key: string]: number;
  };
}

export const productOptionsPricing = new mongoose.Schema<ProductOptionsPricing>(
  {
    sides: {
      type: Map,
      required: false,
    },
    finish: {
      type: Map,
      required: false,
    },
    paper: {
      type: Map,
      required: false,
    },
    dimensions: {
      type: Map,
      required: false,
    },
  }
);

export interface Product extends BaseModel {
  name: string;
  images: string[];
  options: ProductOptions;
  baseUnitPrice: number;
  pricing: ProductOptionsPricing;
  isPublic: boolean;
}

export const productSchema = getSchema<Product>({
  name: {
    type: String,
    required: true,
    unique: true,
    set: normalize,
    minlength: 3,
  },
  images: {
    type: [String],
    required: true,
    default: [],
  },
  options: {
    type: productOptionsSchema,
    required: true,
    default: {},
  },
  baseUnitPrice: {
    type: Number,
    required: true,
    isInteger: true,
    min: 1,
    set: round,
  },
  pricing: {
    type: productOptionsSchema,
    required: true,
    default: {},
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
});

export const Product: Model<Product> =
  mongoose.models?.Product ||
  mongoose.model<Product>(ModelName.Product, productSchema);
