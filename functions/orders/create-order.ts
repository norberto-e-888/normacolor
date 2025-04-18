"use server";

import mongoose from "mongoose";

import {
  ArtSource,
  Order,
  OrderProduct,
  OrderProductOptions,
  Product,
  User,
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
  total: number,
  selectedPoints: number = 0
): Promise<string> => {
  await connectToMongo();

  const session = await getServerSession();
  if (!session) {
    throw new Error("Must be logged in to create an order");
  }

  // Fetch the current user to get their unspent loyalty points
  const user = await User.findById(session.user.id);
  if (!user) {
    throw new Error("User not found");
  }

  // Get unspent loyalty points and validate selected points
  const unspentPoints = user.unspentLoyaltyPoints || 0;

  // Ensure selectedPoints doesn't exceed available points
  const pointsToUse = Math.min(unspentPoints, selectedPoints);

  // Ensure minimum order value of $1 (100 cents)
  const minimumPriceCents = 100;
  const maxPointsAllowed = Math.max(0, total - minimumPriceCents);
  const adjustedPointsToUse = Math.min(pointsToUse, maxPointsAllowed);

  // Calculate final price after points discount (will be at least $1)
  const finalPrice = Math.max(minimumPriceCents, total - adjustedPointsToUse);

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
        cartItem.art = {
          source: ArtSource.Custom,
          value: item.art.value,
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

  // Create the order
  const order = await Order.create({
    customerId: new mongoose.Types.ObjectId(session.user.id),
    cart: updatedCart,
    total: finalPrice,
    loyaltyPointsSpent: adjustedPointsToUse,
  });

  // Update user's unspent points
  if (adjustedPointsToUse > 0) {
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { unspentLoyaltyPoints: -adjustedPointsToUse },
    });
  }

  return order.id as string;
};
