import { NextResponse } from "next/server";

import { fetchProducts } from "@/functions/products";

export async function GET() {
  const result = await fetchProducts();
  return NextResponse.json(result.data?.products || []);
}
