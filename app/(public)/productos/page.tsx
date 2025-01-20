// app/(public)/productos/page.tsx
import { ProductCard } from "@/components/smart/product-card";
import { Content } from "@/components/ui/content";
import { ProductFormProvider } from "@/contexts/use-product-form";
import { fetchProducts } from "@/functions/products";

export default async function ProductsPage() {
  const { ok, data } = await fetchProducts({ isPublic: true });

  if (!ok || !data) {
    return (
      <Content>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-lg text-muted-foreground">
            No se encontraron productos.
          </p>
        </div>
      </Content>
    );
  }

  return (
    <Content>
      <div className="w-full max-w-7xl p-4 sm:px-6 lg:px-8 mx-auto">
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
