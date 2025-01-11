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

export enum ProductOptionSide {
  One = "one",
  Both = "both",
  Diptic = "diptic",
  Triptic = "triptic",
}

export enum ProductOptionFinish {
  PlastifiedGloss = "plastifiedgloss",
  PlastifiedMatte = "plastifiedmatte",
  UVVarnishGloss = "uvvarnishgloss",
  UVVarnishMatte = "uvvarnishmatte",
  None = "none",
}

export enum ProductOptionPaper {
  HundredLbMatte = "100lbmatte",
  HundredLbSatin = "100lbsatin",
  HundredThirtyLbMatte = "130lbmatte",
  HundredThirtyLbSatin = "130lbsatin",
  ThreeHundredGMatte = "300gmatte",
  ThreeHundredGSatin = "300gsatin",
  HundredFiftyGMatte = "150gmatte",
  HundredFiftyGSatin = "150gsatin",
  Chemical = "chemical",
  Bond = "bond",
  Bond20lb = "bond20lb",
}

export type Product = {
  name: string;
  images: string[];
  options: ProductOptions;
  pricing: ProductPricing;
  isPublic: boolean;
} & BaseModel;

export type ProductOptions = {
  sides?: ProductOptionSide[];
  finish?: ProductOptionFinish[];
  paper?: ProductOptionPaper[];
  dimensions?: [number, number][];
};

export type ProductPricingOptionMultipliers = {
  sides?: Map<ProductOptionSide, number>;
  finish?: Map<ProductOptionFinish, number>;
  paper?: Map<ProductOptionPaper, number>;
  dimensions?: Map<string, number>;
};

export type ProductPricing = {
  baseUnitPrice: number;
  optionMultipliers: ProductPricingOptionMultipliers;
  quantityDiscountMultipliers: [number, number][];
};

export const productOptionsSchema = new mongoose.Schema<ProductOptions>(
  {
    sides: {
      type: [String],
      required: false,
      validate: [isEnumArray(ProductOptionSide)],
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

export const productPricingSchema = new mongoose.Schema<ProductPricing>(
  {
    baseUnitPrice: {
      type: Number,
      required: true,
      isInteger: true,
      min: 1,
      set: round,
    },
    optionMultipliers: {
      type: new mongoose.Schema(
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
        },
        { _id: false }
      ),
      required: true,
      default: {},
    },
    quantityDiscountMultipliers: {
      type: [Number],
      required: true,
      default: [],
      validate: [
        {
          validator: (val: [number, number][]) =>
            val.every(
              ([threshold, multiplier, ...rest]) =>
                threshold >= 1 &&
                Number.isInteger(threshold) &&
                multiplier < 1 &&
                multiplier > 0 &&
                rest.length === 0
            ),
          message:
            "Every threshold must be a positive integer and every multiplier must be between 0 and 1 (exclusive)",
        },
        {
          validator: (val: [number, number][]) =>
            val.every(([, , ...rest]) => rest.length === 0),
          message: "Every discount multiplier must be a tuple of size 2",
        },
      ],
      set: (val: [number, number][]) => val.sort((a, b) => b[0] - a[0]),
    },
  },
  { _id: false }
);

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
  pricing: {
    type: productPricingSchema,
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
  mongoose.models?.Product || mongoose.model(ModelName.Product, productSchema);
