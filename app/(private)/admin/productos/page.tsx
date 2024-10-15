"use server";

import { Button } from "@/components/ui";
import { curateArts, fetchArts, getUploadUrl } from "@/functions/art";
import { fetchProducts } from "@/functions/products";

import { Arts } from "./arts";
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

  const { arts } = await fetchArts({
    term: "business card print-ready",
  });

  const { read, write } = await getUploadUrl();

  console.log({ read, write });

  return (
    <div>
      <form action={curateArts}>
        <Button type="submit">Curate Arts</Button>
      </form>
      {data && <Products products={data.products} />}
      {arts && <Arts arts={arts} />}
    </div>
  );
}
