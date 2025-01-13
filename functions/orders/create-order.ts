"use server";

import mongoose from "mongoose";

import {
  ArtSource,
  Order,
  OrderProduct,
  OrderProductOptions,
  Product,
} from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { calculatePrice } from "@/utils/calculate-price";

type CreateOrderItem = Omit<
  OrderProduct,
  "productSnapshot" | "totalPrice" | "id" | "_id"
> & {
  art: { source: ArtSource; value: string };
};

export const createOrder = async (
  cart: CreateOrderItem[],
  total: number
): Promise<{
  order: Order;
}> => {
  await connectToMongo();

  const session = await getServerSession();
  if (!session) {
    throw new Error("Must be logged in to create an order");
  }

  // Fetch product snapshots
  const products = await Product.find({
    _id: {
      $in: cart.map((item) => item.productId),
    },
  });

  const productMap = products.reduce<Record<string, Product>>(
    (acc, product) => ({
      ...acc,
      [product.id]: product,
    }),
    {}
  );

  // Update cart items with product snapshots and format art paths
  const updatedCart = cart.map((item) => {
    const product = productMap[item.productId];
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    // Validate options against product's allowed options
    const validatedOptions: OrderProductOptions = {};

    if (item.options.sides) {
      if (!product.options.sides?.includes(item.options.sides)) {
        throw new Error(
          `Invalid sides option for product ${product.name}: ${item.options.sides}`
        );
      }
      validatedOptions.sides = item.options.sides;
    }

    if (item.options.finish) {
      if (!product.options.finish?.includes(item.options.finish)) {
        throw new Error(
          `Invalid finish option for product ${product.name}: ${item.options.finish}`
        );
      }
      validatedOptions.finish = item.options.finish;
    }

    if (item.options.paper) {
      if (!product.options.paper?.includes(item.options.paper)) {
        throw new Error(
          `Invalid paper option for product ${product.name}: ${item.options.paper}`
        );
      }
      validatedOptions.paper = item.options.paper;
    }

    if (item.options.dimensions) {
      const dimensions = Array.isArray(item.options.dimensions)
        ? item.options.dimensions
        : JSON.parse(item.options.dimensions);

      const dimensionStr = JSON.stringify(dimensions);
      const validDimension = product.options.dimensions?.some(
        (d) => JSON.stringify(d) === dimensionStr
      );

      if (!validDimension) {
        throw new Error(
          `Invalid dimensions for product ${product.name}: ${dimensionStr}`
        );
      }
      validatedOptions.dimensions = dimensions as [number, number];
    }

    const cartItem: Omit<OrderProduct, "id" | "_id"> = {
      productId: item.productId,
      quantity: item.quantity,
      options: validatedOptions,
      productSnapshot: {
        id: product.id,
        name: product.name,
        options: product.options,
        pricing: product.pricing,
      },
      totalPrice: calculatePrice(
        item.quantity,
        product.pricing,
        validatedOptions
      ),
    };

    if (item.art) {
      if (item.art.source === ArtSource.Custom) {
        // Extract folder UUID from the S3 path
        const matches = item.art.value.match(/uploads\/([^/]+)/);
        if (!matches) {
          throw new Error("Invalid custom art path format");
        }
        const folderUuid = matches[1];
        cartItem.art = {
          source: ArtSource.Custom,
          value: folderUuid,
        };
      } else {
        // For Freepik, just store the ID
        cartItem.art = {
          source: ArtSource.Freepik,
          value: item.art.value,
        };
      }
    }

    return cartItem;
  });

  const totalOrderPrice = updatedCart.reduce(
    (acc, item) => acc + item.totalPrice,
    0
  );

  if (totalOrderPrice !== total) {
    throw new Error(`Total price mismatch: ${totalOrderPrice} !== ${total}`);
  }

  // Create order
  const order = await Order.create({
    customerId: new mongoose.Types.ObjectId(session.user.id),
    cart: updatedCart,
    total,
  });

  return {
    order: order.toObject(),
  };
};
