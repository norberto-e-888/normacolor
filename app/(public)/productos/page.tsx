import Image from "next/image";

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
            <div
              key={product.id}
              className="group relative overflow-hidden rounded-lg border bg-background p-6 hover:border-primary transition-colors w-full max-w-sm"
            >
              {product.images.length > 0 ? (
                <div className="aspect-square overflow-hidden rounded-lg bg-muted relative">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-2xl text-muted-foreground">📄</span>
                </div>
              )}

              <div className="mt-4">
                <h2 className="text-lg font-semibold capitalize">
                  {product.name}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.options.paper && (
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs text-primary-foreground">
                      {product.options.paper.length} tipos de papel
                    </span>
                  )}
                  {product.options.dimensions && (
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs text-primary-foreground">
                      {product.options.dimensions.length} tamaños
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Content>
  );
}
