import { fetchProducts } from "@/functions/products";
import { PageProps } from "@/utils";

import { Products } from "./products";

export default async function AdminProductsPage({ searchParams }: PageProps) {
  let searchTerm = searchParams.query;

  if (typeof searchTerm !== "string") {
    searchTerm = "";
  } else {
    searchTerm = searchTerm.trim();
  }

  const { data } = await fetchProducts({
    searchTerm,
  });

  return <div>{data && <Products products={data.products} />}</div>;
}
