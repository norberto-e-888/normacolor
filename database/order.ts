import mongoose, {
  CallbackWithoutResultAndOptionalError,
  HydratedDocument,
  Model,
} from "mongoose";

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
  ProductOptionSides,
  productSchema,
} from "./product";

export interface OrderProductOptions {
  sides?: ProductOptionSides;
  finish?: ProductOptionFinish;
  paper?: ProductOptionPaper;
  dimensions?: [number, number];
}

const orderProductOptionsSchema = new mongoose.Schema<OrderProductOptions>({
  sides: {
    type: String,
    required: false,
    enum: Object.values(ProductOptionSides),
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
              Number.isInteger(x) && x > 0 && Number.isInteger(y) && y > 0
          ),
        message: "Each dimension must be a positive integer",
      },
    ],
  },
});

export interface OrderProduct<FE = false> {
  productId: FE extends true ? string : mongoose.Types.ObjectId;
  quantity: number;
  options: OrderProductOptions;
}

const orderProductSchema = new mongoose.Schema<OrderProduct>(
  {
    productId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: ModelName.Product,
    },
    quantity: {
      type: Number,
      required: true,
      isInteger: true,
      min: 1,
    },
    options: {
      type: orderProductOptionsSchema,
      required: true,
      default: {},
    },
  },
  { _id: false }
);

orderProductSchema.pre("save", ensureRefIntegrity);

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

export type ProductSnapshotEntry = Pick<Product, "name" | "price">;
export type ProductSnapshots = Map<string, ProductSnapshotEntry>;

export interface Order<FE = false> extends BaseModel {
  cart: OrderProduct[];
  customerId: FE extends true ? string : mongoose.Types.ObjectId;
  total: number;
  status: OrderStatus;
  productSnapshots?: ProductSnapshots;
}

const orderSchema = getSchema<Order>({
  cart: {
    type: [orderProductSchema],
    required: true,
    validate: [
      isArrayMinLength(1, "Products must contain at least one product"),
    ],
  },
  customerId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: ModelName.User,
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
  productSnapshots: {
    type: Map,
    required: function (this: Order) {
      return this.status !== OrderStatus.Draft;
    },
    of: productSchema.set("_id", false),
  },
});

orderSchema.pre("save", ensureRefIntegrity);
orderSchema.pre(
  "save",
  async function (
    this: HydratedDocument<Order>,
    next: CallbackWithoutResultAndOptionalError
  ) {
    if (this.status === OrderStatus.Draft) {
      const productModel = this.db.model<Product>(ModelName.Product);
      const products = await productModel.find({
        _id: {
          $in: this.cart.map(({ productId }) => productId),
        },
      });

      const productIdToPriceMap = products.reduce<{ [key: string]: number }>(
        (_map, { _id, price }) => ({
          ..._map,
          [_id.toString()]: price,
        }),
        {}
      );

      const total = this.cart.reduce(
        (_total, product) =>
          _total +
          product.quantity * productIdToPriceMap[product.productId.toString()],
        0
      );

      this.total = total;
    }

    next();
  }
);

orderSchema.index({
  "products.productId": 1,
});

orderSchema.index({
  customerId: 1,
});

orderSchema.method(
  "generateSnapshots",
  async function generateSnapshots(
    this: Order
  ): Promise<Order["productSnapshots"]> {
    const snapshots: ProductSnapshots = new Map();

    for (const { productId } of this.cart) {
      // casting is safe due to order.cart's ensureRefIntegrity hook
      const product = (await Product.findById(
        productId.toString()
      )) as HydratedDocument<Product>;

      const { name, price } = product.toObject();
      snapshots.set(productId.toString(), {
        name,
        price,
      });
    }

    return snapshots;
  }
);

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
      const required = optionsMap[productId.toString()];

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

interface OTPMethods {
  generateSnapshots(): Promise<ProductSnapshots>;
  validateOptions(): Promise<boolean>;
}

type OrderModel = Model<Order, unknown, OTPMethods>;

export const Order: Model<Order> =
  mongoose.models?.Order ||
  mongoose.model<Order, OrderModel>(ModelName.Order, orderSchema);
