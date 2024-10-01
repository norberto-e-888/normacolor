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
  ModelName,
  round,
} from "@/utils";

import { Product, productSchema } from "./product";

export interface OrderProduct<FE = false> {
  productId: FE extends true ? string : mongoose.Types.ObjectId;
  quantity: number;
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

export interface Order<FE = false> extends BaseModel {
  cart: OrderProduct[];
  customerId: FE extends true ? string : mongoose.Types.ObjectId;
  total: number;
  status: OrderStatus;
  productsSnapshot?: Map<string, Product>;
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
  productsSnapshot: {
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
  "generateSnapshot",
  async function generateSnapshot(
    this: Order
  ): Promise<Order["productsSnapshot"]> {
    const snapshot = new Map<string, Product>();

    for (const { productId } of this.cart) {
      // casting is safe due to order.cart's ensureRefIntegrity hook
      const product = (await Product.findById(
        productId.toString()
      )) as HydratedDocument<Product>;

      snapshot.set(productId.toString(), product.toObject());
    }

    return snapshot;
  }
);

interface OTPMethods {
  generateSnapshot(): number;
}

type OrderModel = Model<Order, unknown, OTPMethods>;

export const Order: Model<Order> =
  mongoose.models?.Order ||
  mongoose.model<Order, OrderModel>(ModelName.Order, orderSchema);
