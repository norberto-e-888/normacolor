"use server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";

import { config } from "@/config";
import { ArtSource, Order, OrderProduct, Product } from "@/database";
import { connectToMongo } from "@/lib/server";

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_SECRET_KEY,
  },
});

type CreateOrderItem = Omit<OrderProduct, "productSnapshot"> & {
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

    const cartItem: OrderProduct = {
      ...item,
      productSnapshot: {
        id: product.id,
        name: product.name,
        options: product.options,
        pricing: product.pricing,
      },
    };

    if (item.art.source === ArtSource.Custom) {
      const upload = uploadUrls.find((u) => u?.itemId === item.productId);
      if (upload) {
        cartItem.art = {
          ...item.art,
          value: `s3://${config.AWS_BUCKET_NAME}/${upload.key}`,
        };
      }
    }

    return cartItem;
  });

  // Create order
  const order = await Order.create({
    customerId: "anonymous", // We'll update this later when implementing auth
    cart: updatedCart,
    total,
  });

  return {
    order,
    uploadUrls: uploadUrls.filter(Boolean) as UploadUrl[],
  };
};

type UploadUrl = { itemId: string; url: string; key: string };
