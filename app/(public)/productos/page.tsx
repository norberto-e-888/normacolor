import { ProductCard } from "@/components/smart/ProductCard";
import { Content } from "@/components/ui";
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
    <Content center>
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Explora nuestra selección de productos de impresión de alta calidad.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </Content>
  );
}
