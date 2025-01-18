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

export type Product<FE extends boolean = false> = {
  name: string;
  images: string[];
  options: ProductOptions;
  pricing: ProductPricing;
  isPublic: boolean;
} & BaseModel<FE>;

export type ProductOptions = {
  sides?: ProductOptionSide[];
  finish?: ProductOptionFinish[];
  paper?: ProductOptionPaper[];
  dimensions?: [number, number][];
};

export type ProductPricingOptionMultipliers = {
  sides?: Record<ProductOptionSide, number>;
  finish?: Record<ProductOptionFinish, number>;
  paper?: Record<ProductOptionPaper, number>;
  dimensions?: Record<string, number>;
};

export type ProductPricing = {
  baseUnitPrice: number;
  minimumPurchase: number;
  optionMultipliers: ProductPricingOptionMultipliers;
  quantityDiscountMultipliers: [number, number][];
};

export const productOptionsSchema = new mongoose.Schema<ProductOptions>(
  {
    sides: {
      type: [String],
      required: true,
      default: [],
      validate: [isEnumArray(ProductOptionSide)],
    },
    finish: {
      type: [String],
      required: true,
      default: [],
      validate: [isEnumArray(ProductOptionFinish)],
    },
    paper: {
      type: [String],
      required: true,
      default: [],
      validate: [isEnumArray(ProductOptionPaper)],
    },
    dimensions: {
      type: [[Number]],
      required: true,
      default: [],
      validate: [
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
      default: 1,
    },
    minimumPurchase: {
      type: Number,
      required: true,
      isInteger: true,
      min: 1,
      set: round,
      default: 10000,
    },
    optionMultipliers: {
      type: new mongoose.Schema(
        {
          sides: {
            type: Object,
            required: true,
            default: {},
          },
          finish: {
            type: Object,
            required: true,
            default: {},
          },
          paper: {
            type: Object,
            required: true,
            default: {},
          },
          dimensions: {
            type: Object,
            required: true,
            default: {},
          },
        },
        { _id: false }
      ),
      required: true,
      default: {},
    },
    quantityDiscountMultipliers: {
      type: [[Number]],
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
  },
  pricing: {
    type: productPricingSchema,
    required: true,
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
