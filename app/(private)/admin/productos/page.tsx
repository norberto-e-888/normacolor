import { fetchProducts } from "@/functions/products";
import { PageProps } from "@/utils";

import { Products } from "./products";

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { data } = await fetchProducts({
    searchTerm: searchParams.query as string,
  });

  return <div>{data && <Products products={data.products} />}</div>;
}
