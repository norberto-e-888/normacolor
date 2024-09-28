"use server";

import z from "zod";

import { Product, UserRole } from "@/models";
import { normalize } from "@/models/utils";

import { getServerSession } from "../auth";

const dataSchema = z.object({
  name: z.string({
    message: "'nombre' debe ser una cadena.",
    required_error: '"nombre" es requerido.',
  }),
  price: z
    .number({
      message: "'precio' debe ser un numero.",
      required_error: "'precio' es requerido.",
    })
    .int({
      message: "'precio' debe ser un entero.",
    })
    .min(1, "'precio' debe ser mayor a cero."),
}) satisfies z.ZodType<Pick<Product, "name" | "price">>;

type Data = z.infer<typeof dataSchema>;

export const createProduct = async (data: Data) => {
  const session = await getServerSession();

  if (!session || session.user.role !== UserRole.Admin) {
    return {
      ok: false,
      message: "No tienes acceso a este recurso.",
    };
  }

  const validation = await dataSchema.safeParseAsync(data);

  if (!validation.success) {
    return {
      ok: false,
      message: validation.error.flatten(),
    };
  }

  const existingByName = await Product.findOne({
    name: normalize(data.name),
  });

  if (existingByName) {
    return {
      ok: false,
      message: `Ya existe un producto con nombre: "${data.name}".`,
    };
  }

  const product = await Product.create({
    name: data.name,
    price: data.price,
  });

  return {
    ok: true,
    data: {
      product,
    },
  };
};
