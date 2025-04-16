// app/(public)/productos/page.tsx
import { redirect } from "next/navigation";

import { ProductCard } from "@/components/smart/product-card";
import { CategoryBar } from "@/components/ui/category-bar";
import { Content } from "@/components/ui/content";
import { ProductFormProvider } from "@/contexts/use-product-form";
import { ProductCategory } from "@/database/product";
import { fetchProducts } from "@/functions/products";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category || ProductCategory.Impresos;

  if (!Object.values(ProductCategory).includes(category as ProductCategory)) {
    redirect(`/productos?category=${ProductCategory.Impresos}`);
  }

  const { ok, data } = await fetchProducts({
    isPublic: true,
    category: category as ProductCategory,
  });

  if (!ok || !data || data.products.length === 0) {
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
        <ProductFormProvider>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </ProductFormProvider>
      </div>
    </Content>
  );
}
