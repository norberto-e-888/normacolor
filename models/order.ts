import mongoose, {
  CallbackWithoutResultAndOptionalError,
  HydratedDocument,
  Model,
} from "mongoose";

import { Product } from "./product";
import {
  BaseModel,
  ensureRefIntegrity,
  getSchema,
  isArrayMinLength,
  ModelName,
  round,
} from "./utils";

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
  products: OrderProduct[];
  customerId: FE extends true ? string : mongoose.Types.ObjectId;
  total: number;
  status: OrderStatus;
}

const orderSchema = getSchema<Order>({
  products: {
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
          $in: this.products.map(({ productId }) => productId),
        },
      });

      const total = this.products.reduce(
        (_total, product) =>
          _total +
          product.quantity *
            (
              products.find(
                ({ id }) => id === product.productId.toString()
              ) as Product
            ).price,
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

export const Order: Model<Order> =
  mongoose.models.Order || mongoose.model<Order>(ModelName.Order, orderSchema);
