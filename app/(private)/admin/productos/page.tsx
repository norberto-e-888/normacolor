import { fetchArts } from "@/functions/art";
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

  return (
    <div>
      {data && <Products products={data.products} />}

      {arts && <Arts arts={arts} />}
    </div>
  );
}
