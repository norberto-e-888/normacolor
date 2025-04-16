"use server";

import z from "zod";

import { Product, ProductCategory } from "@/database";
import { isAdmin } from "@/guards";
import { connectToMongo } from "@/lib/server";
import { normalize } from "@/utils";

const dataSchema = z.object({
  name: z
    .string({
      message: "'nombre' debe ser una cadena.",
      required_error: '"nombre" es requerido.',
    })
    .max(64, "'nombre' no puede tener mas de 64 caracteres"),
  category: z.nativeEnum(ProductCategory, {
    required_error: "La categoría es requerida",
    invalid_type_error: "Categoría inválida",
  }),
}) satisfies z.ZodType<Pick<Product, "name" | "category">>;

export type CreateProductData = z.infer<typeof dataSchema>;

export const createProduct = isAdmin(async (data: CreateProductData) => {
  data.name = normalize(data.name);

  const validation = await dataSchema.safeParseAsync(data);

  if (!validation.success) {
    return {
      ok: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  await connectToMongo();

  const existingByName = await Product.findOne({
    name: data.name,
  });

  if (existingByName) {
    return {
      ok: false,
      message: `Ya existe un producto con nombre: "${data.name}".`,
    };
  }

  const product = await Product.create({
    name: data.name,
    category: data.category,
    pricing: {
      baseUnitPrice: 1,
      minimumPurchase: 10000,
      optionMultipliers: {
        sides: {},
        finish: {},
        paper: {},
        dimensions: {},
      },
      quantityDiscountMultipliers: [],
    },
    options: {
      sides: [],
      finish: [],
      paper: [],
      dimensions: [],
    },
  });

  return {
    ok: true,
    data: {
      product: product.toObject(),
    },
  };
});
