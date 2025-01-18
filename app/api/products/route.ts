import { NextResponse } from "next/server";
import { z } from "zod";

import { Product } from "@/database";
import { createProduct } from "@/functions/products";
import { fetchProducts } from "@/functions/products";
import { normalize } from "@/utils";

const createProductSchema = z.object({
  name: z
    .string({
      required_error: "El nombre es requerido",
      invalid_type_error: "El nombre debe ser texto",
    })
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(64, "El nombre no puede tener más de 64 caracteres")
    .transform(normalize),
});

export async function GET() {
  const result = await fetchProducts();
  return NextResponse.json(result.data?.products || []);
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = await createProductSchema.safeParseAsync(json);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const createResult = await createProduct({
      name: result.data.name,
    });

    if (!createResult.ok) {
      return NextResponse.json(
        {
          error: createResult.message || "Failed to create product",
          details: createResult.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(createResult.data);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
