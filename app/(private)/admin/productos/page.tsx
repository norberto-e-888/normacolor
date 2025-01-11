"use server";

import { getUploadUrls } from "@/functions/art";
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

  await getUploadUrls();

  return <div>{data && <Products products={data.products} />}</div>;
}
