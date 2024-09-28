"use server";

import z from "zod";

import { Product } from "@/models";

import { getServerSession } from "../auth";

const dataSchema = z.object({
  priceRange: z
    .object({
      from: z.number().int().default(0),
      to: z.number().int().default(Infinity),
    })
    .default({
      from: 0,
      to: Infinity,
    }),
  isPublic: z.boolean().optional().default(false),
});

export type FetchProductData = z.infer<typeof dataSchema>;

export const fetchProducts = async (data: FetchProductData) => {
  const session = await getServerSession();
  const validation = await dataSchema.safeParseAsync(data);

  if (!validation.success) {
    return {
      ok: false,
      message: validation.error.flatten(),
    };
  }

  const products = await Product.find({
    isPublic: session ? data.isPublic : true,
    price: {
      $gte: data.priceRange.from,
      $lte: data.priceRange.to,
    },
  });

  return {
    ok: true,
    data: {
      products,
    },
  };
};
