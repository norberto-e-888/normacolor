"use server";

import z from "zod";

import { Product } from "@/models";

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
});

type Data = z.infer<typeof dataSchema>;

export const fetchProducts = async (data: Data) => {
  const validation = await dataSchema.safeParseAsync(data);

  if (!validation.success) {
    return {
      ok: false,
      message: validation.error.flatten(),
    };
  }

  const products = await Product.find({
    isPublic: true,
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
