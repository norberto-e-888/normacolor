"use client";

import { Content } from "@/components/ui/content";
import { Product } from "@/database";

export function Products({ products }: { products: Product<true>[] }) {
  return (
    <Content>
      {products.map(({ id, name }) => (
        <div key={id}>
          <p>{name}</p>
        </div>
      ))}
    </Content>
  );
}
