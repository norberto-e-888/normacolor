"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Product, ProductCategory } from "@/database/product";

type ProductWithFE = Product<true>;

interface ProductSearchProps {
  products: ProductWithFE[];
  category: string;
  onFilteredProductsChange: (filteredProducts: ProductWithFE[]) => void;
}

export function ProductSearch({
  products,
  category,
  onFilteredProductsChange,
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (category !== ProductCategory.Impresos) {
      // If not impresos category, reset search and show all products
      setSearchTerm("");
      onFilteredProductsChange(products);
      return;
    }

    // Even empty searches should trigger the callback to update search status
    const normalizedSearch = searchTerm.toLowerCase().trim();

    if (normalizedSearch === "") {
      onFilteredProductsChange(products);
      return;
    }

    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(normalizedSearch)
    );

    onFilteredProductsChange(filtered);
  }, [searchTerm, products, category, onFilteredProductsChange]);

  // Only show search bar for impresos category
  if (category !== ProductCategory.Impresos) {
    return null;
  }

  return (
    <div className="relative w-full max-w-sm mb-6">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar productos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-8"
      />
      {searchTerm.trim() !== "" && (
        <button
          onClick={() => setSearchTerm("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
