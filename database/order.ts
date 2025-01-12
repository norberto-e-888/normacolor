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
} from "./product";

export enum OrderStatus {
  WaitingForPayment = "waiting_for_payment",
  Paid = "paid",
  InProgress = "in-progress",
  ReadyToPickUp = "ready-to-pickup",
  EnRoute = "en-route",
  Delivered = "delivered",
  Cancelled = "cancelled",
}

export enum ArtSource {
  Freepik = "freepik",
  Custom = "custom",
}

export type OrderArt = {
  source: ArtSource;
  value: string; // Freepik ID or S3 URL
};

export type Order<FE = false> = {
  customerId: FE extends true ? string : mongoose.Types.ObjectId;
  cart: OrderProduct[];
  total: number;
  status: OrderStatus;
} & BaseModel;

export type OrderProduct = {
  productId: string;
  productSnapshot: ProductSnapshot;
  options: OrderProductOptions;
  quantity: number;
  totalPrice: number;
  art?: OrderArt;
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

const orderArtSchema = new mongoose.Schema<OrderArt>(
  {
    source: {
      type: String,
      required: true,
      enum: Object.values(ArtSource),
    },
    value: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const orderProductSchema = new mongoose.Schema<OrderProduct>(
  {
    productId: {
      type: String,
      required: true,
    },
    productSnapshot: {
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
          type: new mongoose.Schema<ProductOptions>({
            sides: {
              type: [String],
              required: false,
            },
            finish: {
              type: [String],
              required: false,
            },
            paper: {
              type: [String],
              required: false,
            },
            dimensions: {
              type: [[Number]],
              required: false,
            },
          }),
          required: true,
        },
        pricing: {
          type: new mongoose.Schema({
            baseUnitPrice: {
              type: Number,
              required: true,
            },
            minimumPurchase: {
              type: Number,
              required: true,
            },
            optionMultipliers: {
              type: Object,
              required: true,
            },
            quantityDiscountMultipliers: {
              type: [[Number]],
              required: true,
            },
          }),
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
                validator: (dimensions: [number, number]) =>
                  dimensions.every((d) => d > 0),
                message: "Each dimension must be a positive number",
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
      min: 1,
    },
    art: {
      type: orderArtSchema,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      set: round,
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
    min: 1,
    set: round,
  },
  status: {
    type: String,
    required: true,
    default: OrderStatus.WaitingForPayment,
    enum: Object.values(OrderStatus),
  },
});

orderSchema.pre("save", ensureRefIntegrity);

orderSchema.index({
  customerId: 1,
});

orderSchema.index({
  "cart.productId": 1,
});

orderSchema.method(
  "validateOptions",
  async function validateOptions(this: Order): Promise<boolean> {
    const products = await Product.find({
      _id: {
        $in: this.cart.map(({ productId }) => productId),
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

    for (const { productId, options: given } of this.cart) {
      const required = optionsMap[productId];

      for (const [name, allowed] of Object.entries(required)) {
        const value = given[name as keyof ProductOptions];

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
