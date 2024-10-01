"use server";

import z from "zod";

import { Product, UserRole } from "@/database";
import { connectToMongo } from "@/lib/server";

import { getServerSession } from "../auth";

const querySchema = z.object({
  isPublic: z.boolean().optional(),
  searchTerm: z.string().optional(),
});

export type FetchProductQuery = z.infer<typeof querySchema>;

export const fetchProducts = async ({
  isPublic,
  searchTerm = "",
}: FetchProductQuery = {}) => {
  const session = await getServerSession();
  const validation = await querySchema.safeParseAsync({
    isPublic,
    searchTerm,
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

  await connectToMongo();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeline: any[] = [
    {
      $match: {
        ...isPublicFilter,
      },
    },
    {
      $sort: { createdAt: -1 as -1 },
    },
  ];

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  if (normalizedSearchTerm) {
    pipeline.unshift({
      $search: {
        index: "default",
        compound: {
          must: normalizedSearchTerm
            .split(" ")
            .filter(Boolean)
            .map((term) => ({
              wildcard: {
                query: `${term}*`,
                path: "name",
                allowAnalyzedField: true,
              },
            })),
        },
      },
    });
  }

  const products = await Product.aggregate(pipeline);

  return {
    ok: true,
    data: {
      products: products.map((product) => ({
        ...product,
        __v: undefined,
        _id: undefined,
        id: product._id.toString(),
      })),
    },
  };
};
