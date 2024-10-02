import mongoose, { Model } from "mongoose";

import {
  BaseModel,
  ensureRefIntegrity,
  getSchema,
  isArrayMinLength,
  isExactLength,
  ModelName,
  round,
} from "@/utils";

import {
  Product,
  ProductOptionFinish,
  ProductOptionPaper,
  ProductOptions,
  ProductOptionSide,
  productOptionsSchema,
  productPricingSchema,
} from "./product";

export enum OrderStatus {
  Draft = "draft",
  Placed = "placed",
  Paid = "paid",
  InProgress = "in-progress",
  ReadyToPickUp = "ready-to-pickup",
  EnRoute = "en-route",
  Delivered = "delivered",
  Cancelled = "cancelled",
}

export type Order<FE = false> = {
  customerId: FE extends true ? string : mongoose.Types.ObjectId;
  cart: OrderProduct[];
  total: number;
  status: OrderStatus;
} & BaseModel;

export type OrderProduct = {
  product: ProductSnapshot;
  options: OrderProductOptions;
  quantity: number;
  addedAt: Date;
};

export type ProductSnapshot = Pick<
  Product,
  "id" | "name" | "options" | "pricing"
>;

export type OrderProductOptions = {
  sides?: ProductOptionSide;
  finish?: ProductOptionFinish;
  paper?: ProductOptionPaper;
  dimensions?: [number, number];
};

const orderProductSchema = new mongoose.Schema<OrderProduct>(
  {
    product: {
      type: new mongoose.Schema<ProductSnapshot>({
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        options: {
          type: productOptionsSchema,
          required: true,
        },
        pricing: {
          type: productPricingSchema,
          required: true,
        },
      }),
      required: true,
    },
    options: {
      type: new mongoose.Schema<OrderProductOptions>(
        {
          sides: {
            type: String,
            required: false,
            enum: Object.values(ProductOptionSide),
          },
          finish: {
            type: String,
            required: false,
            enum: Object.values(ProductOptionFinish),
          },
          paper: {
            type: String,
            required: false,
            enum: Object.values(ProductOptionPaper),
          },
          dimensions: {
            type: [Number],
            required: false,
            validate: [
              isExactLength(2),
              {
                validator: (dimensions: [[number, number]]) =>
                  dimensions.every(
                    ([x, y]) =>
                      Number.isInteger(x) &&
                      x > 0 &&
                      Number.isInteger(y) &&
                      y > 0
                  ),
                message: "Each dimension must be a positive integer",
              },
            ],
          },
        },
        {
          _id: false,
        }
      ),
      required: true,
      default: {},
    },
    quantity: {
      type: Number,
      required: true,
      isInteger: true,
      min: 1,
    },
    addedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  { _id: false }
);

const orderSchema = getSchema<Order>({
  customerId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: ModelName.User,
  },
  cart: {
    type: [orderProductSchema],
    required: true,
    validate: [
      isArrayMinLength(1, "Products must contain at least one product"),
    ],
  },
  total: {
    type: Number,
    required: true,
    isInteger: true,
    min: 1,
    set: round,
  },
  status: {
    type: String,
    required: true,
    default: OrderStatus.Draft,
    enum: Object.values(OrderStatus),
  },
});

orderSchema.pre("save", ensureRefIntegrity);

orderSchema.index({
  customerId: 1,
});

orderSchema.index({
  "cart.products.id": 1,
});

orderSchema.method(
  "validateOptions",
  async function validateOptions(this: Order): Promise<boolean> {
    const products = await Product.find({
      _id: {
        $in: this.cart.map(({ product }) => product.id),
      },
    });

    const optionsMap = products.reduce<{
      [key: string]: ProductOptions;
    }>(
      (map, product) => ({
        ...map,
        [product._id.toString()]: product.options,
      }),
      {}
    );

    for (const { product, options: given } of this.cart) {
      const required = optionsMap[product.id];

      for (const [name, allowed] of Object.entries(required)) {
        const value = given[name as keyof ProductOptions];

        // this represent a product having a certain option set, and therefore required, and the new order for that
        // product not even including a value for it. Note: products don't set default values for options, hence why
        // there mere presence of an options, makes it required for the request to include. Default values can still
        // be implemented client-side, in the forms
        if (!value) {
          return false;
        }

        const isAllowed = (allowed as unknown[]).includes(value);
        if (!isAllowed) {
          return false;
        }
      }
    }

    return true;
  }
);

export const Order: Model<
  Order,
  unknown,
  {
    validateOptions(): Promise<boolean>;
  }
> = mongoose.models?.Order || mongoose.model(ModelName.Order, orderSchema);
