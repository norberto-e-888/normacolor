"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

import { ProductCategory } from "@/database/product";
import { cn } from "@/lib/client";

type CategoryBarProps = {
  className?: string;
};

export function CategoryBar({ className }: CategoryBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory =
    searchParams.get("category") || ProductCategory.Impresos;

  const handleCategoryChange = useCallback(
    (category: ProductCategory) => {
      const params = new URLSearchParams(searchParams);
      params.set("category", category);
      router.push(`/productos?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (
      !Object.values(ProductCategory).includes(
        currentCategory as ProductCategory
      )
    ) {
      handleCategoryChange(ProductCategory.Impresos);
    }
  }, [currentCategory, handleCategoryChange]);

  return (
    <div className={cn("flex justify-center gap-4 p-4", className)}>
      {Object.entries(ProductCategory).map(([key, value]) => (
        <button
          key={value}
          onClick={() => handleCategoryChange(value)}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            currentCategory === value
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          {key === "ThreeD" ? "3D" : key}
        </button>
      ))}
    </div>
  );
}
