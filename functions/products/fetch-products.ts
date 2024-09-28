"use server";

import z from "zod";

import { Product, UserRole } from "@/database";

import { getServerSession } from "../auth";

const querySchema = z.object({
  priceRange: z
    .object({
      from: z.number().optional(),
      to: z.number().optional(),
    })
    .refine(
      ({ from = 1, to = Infinity }) => from < to,
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
  isPublic,
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

  const isPublicFilter: {
    isPublic?: boolean;
  } = {
    isPublic: session?.user.role === UserRole.Client ? true : isPublic,
  };

  /* we have to do this because the presence of the "isPublic" key even when 
     the value is undefined, will result in mongo returning only those that have
     an explicit key set to undefined instead of ignoring the filter as the client
     expects
  */

  if (
    session &&
    session.user.role === UserRole.Admin &&
    isPublic === undefined
  ) {
    delete isPublicFilter.isPublic;
  }

  const products = await Product.find({
    ...isPublicFilter,
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
