"use client";

import { useQuery } from "@tanstack/react-query";

import { Product } from "@/database";

export function useProducts() {
  return useQuery<Product<true>[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });
}
