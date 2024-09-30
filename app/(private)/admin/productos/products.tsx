"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import { Product } from "@/database";
import { formatCents } from "@/utils";

export function Products({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handleSearch = useDebouncedCallback((term: string) => {
    console.log(`Searching... ${term}`);

    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }

    router.replace(`/admin/productos?${params.toString()}`);
  }, 300);

  return (
    <div>
      <input
        placeholder="Busca..."
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        defaultValue={searchParams.get("query")?.toString()}
      />
      {products.map(({ id, name, price }) => (
        <div key={id}>
          <p>Nombre: {name}</p>
          <p>Precio: {formatCents(price)}</p>
        </div>
      ))}
    </div>
  );
}
