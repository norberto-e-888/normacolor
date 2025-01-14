"use server";

import { Products } from "@/components/smart/products";
import { fetchProducts } from "@/functions/products";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: {
    [key: string]: string;
  };
}) {
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
