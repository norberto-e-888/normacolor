import mongoose, {
  CallbackWithoutResultAndOptionalError,
  HydratedDocument,
  Model,
} from "mongoose";
import { Product, PRODUCT_MODEL_NAME } from "./product";
import { BaseModel, ensureRefIntegrity, getSchema } from "./utils";
import { USER_MODEL_NAME } from "./user";

export interface OrderProduct<FE = false> {
  productId: FE extends true ? string : mongoose.Types.ObjectId;
  quantity: number;
}

const orderProductSchema = new mongoose.Schema<OrderProduct>(
  {
    productId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: PRODUCT_MODEL_NAME,
      transform: (val: mongoose.Types.ObjectId) => val.toString(),
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

export const ORDER_MODEL_NAME = "Order";

const orderSchema = getSchema<Order>({
  products: {
    type: [orderProductSchema],
    required: true,
    validate: [
      {
        validator: (value: OrderProduct[]) => value.length >= 1,
        message: "Products must contain at least one product",
      },
    ],
  },
  customerId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: USER_MODEL_NAME,
    transform: (val: mongoose.Types.ObjectId) => val.toString(),
  },
  total: {
    type: Number,
    required: true,
    isInteger: true,
    min: 1,
    set: (value: number) => Math.round(value),
  },
  status: {
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
      const productModel = this.db.model<Product>(PRODUCT_MODEL_NAME);
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
  mongoose.models.User || mongoose.model<Order>(ORDER_MODEL_NAME, orderSchema);
