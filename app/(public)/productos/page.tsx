// app/(public)/productos/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ProductCard } from "@/components/smart/product-card";
import { ProductSearch } from "@/components/smart/product-search";
import { CategoryBar } from "@/components/ui/category-bar";
import { Content } from "@/components/ui/content";
import { ProductFormProvider } from "@/contexts/use-product-form";
import { Product, ProductCategory } from "@/database/product";
import { fetchProducts } from "@/functions/products";

type ProductWithFE = Product<true>;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || ProductCategory.Impresos;
  const [products, setProducts] = useState<ProductWithFE[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithFE[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [searchApplied, setSearchApplied] = useState(false);

  // Fetch products on mount and when category changes
  useEffect(() => {
    const getProducts = async () => {
      setIsLoading(true);
      setSearchApplied(false);

      try {
        // Validate category or redirect
        if (
          !Object.values(ProductCategory).includes(category as ProductCategory)
        ) {
          window.location.href = `/productos?category=${ProductCategory.Impresos}`;
          return;
        }

        const { ok, data } = await fetchProducts({
          isPublic: true,
          category: category as ProductCategory,
        });

        if (!ok || !data) {
          setHasError(true);
          setProducts([]);
          setFilteredProducts([]);
        } else {
          setProducts(data.products);
          setFilteredProducts(data.products);
        }
      } catch (error) {
        setHasError(true);
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    getProducts();
  }, [category]);

  // Callback for when filtered products change
  const handleFilteredProductsChange = (filtered: ProductWithFE[]) => {
    setFilteredProducts(filtered);
    setSearchApplied(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <Content>
        <CategoryBar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-lg text-muted-foreground">Cargando productos...</p>
        </div>
      </Content>
    );
  }

  // Show error or if there are no products in the category at all
  if (hasError || products.length === 0) {
    return (
      <Content>
        <CategoryBar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-lg text-muted-foreground">
            No se encontraron productos en esta categoría.
          </p>
        </div>
      </Content>
    );
  }

  return (
    <Content padding={false} center>
      <div className="w-full max-w-screen-2xl mx-auto sm:p-2 md:p-4 lg:p-6 xl:py-10">
        <CategoryBar className="mb-6" />

        {/* Search bar always visible for impresos category */}
        <div className="flex justify-center mb-6">
          <ProductSearch
            products={products}
            category={category}
            onFilteredProductsChange={handleFilteredProductsChange}
          />
        </div>

        <ProductFormProvider>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : searchApplied ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <p className="text-lg text-muted-foreground">
                No se encontraron productos que coincidan con tu búsqueda.
              </p>
            </div>
          ) : null}
        </ProductFormProvider>
      </div>
    </Content>
  );
}
