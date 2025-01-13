"use server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

import { config } from "@/config";
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

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_SECRET_KEY,
  },
});

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
  uploadUrls: UploadUrl[];
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

  // Generate presigned URLs for custom art uploads
  const uploadUrls = await Promise.all(
    cart.map(async (item) => {
      if (item.art.source !== ArtSource.Custom) return null;

      const key = `orders/${uuid()}.psd`;
      const command = new PutObjectCommand({
        Bucket: config.AWS_BUCKET_NAME,
        Key: key,
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      return {
        itemId: item.productId,
        url,
        key,
      };
    })
  );

  // Update cart items with product snapshots and S3 URLs for custom arts
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
        const upload = uploadUrls.find((u) => u?.itemId === item.productId);
        if (upload) {
          cartItem.art = {
            source: item.art.source,
            value: `s3://${config.AWS_BUCKET_NAME}/${upload.key}`,
          };
        }
      } else {
        cartItem.art = item.art;
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
    uploadUrls: uploadUrls.filter(Boolean) as UploadUrl[],
  };
};

type UploadUrl = { itemId: string; url: string; key: string };
