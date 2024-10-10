import { fetchArts } from "@/functions/art/fetch-arts";
import { fetchProducts } from "@/functions/products";

import { Products } from "./products";

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

  await fetchArts();

  return <div>{data && <Products products={data.products} />}</div>;
}
