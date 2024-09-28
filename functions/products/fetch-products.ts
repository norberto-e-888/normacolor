"use server";

import z from "zod";

import { Product, UserRole } from "@/database";

import { getServerSession } from "../auth";

const querySchema = z.object({
  priceRange: z
    .object({
      from: z.number().optional().default(1),
      to: z.number().optional().default(Infinity),
    })
    .refine(
      ({ from, to }) => from < to,
      "Limite inferior debe ser menor a limite mayor."
    )
    .optional(),
  isPublic: z.boolean().optional(),
});

export type FetchProductQuery = z.infer<typeof querySchema>;

export const fetchProducts = async ({
  priceRange: { from: fromPrice = 1, to: toPrice = Infinity } = {
    from: 1,
    to: Infinity,
  },
  isPublic = true,
}: FetchProductQuery = {}) => {
  const session = await getServerSession();
  const validation = await querySchema.safeParseAsync({
    priceRange: {
      from: fromPrice,
      to: toPrice,
    },
    isPublic,
  });

  if (!validation.success) {
    return {
      ok: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const products = await Product.find({
    isPublic: session && session.user.role === UserRole.Admin ? isPublic : true,
    price: {
      $gte: fromPrice,
      $lte: toPrice,
    },
  }).sort({
    createdAt: "desc",
  });

  return {
    ok: true,
    data: {
      products: products.map((product) => product.toObject()),
    },
  };
};
