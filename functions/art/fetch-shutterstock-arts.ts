import { Art } from "./fetch-arts";

export const fetchShutterstockArts = async ({
  term = "",
}: {
  term?: string;
} = {}): Promise<{
  arts: Art[];
}> => {
  const options: RequestInit = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.SHUTTERSTOCK_API_KEY}`,
    },
  };

  const params = new URLSearchParams({
    query: term,
    image_type: "photo,illustration,vector",
    format: "psd",
    per_page: "20",
    sort: "popular",
  });

  const response = await fetch(
    `https://api.shutterstock.com/v2/images/search?${params.toString()}`,
    options
  );

  if (!response.ok) {
    throw new Error("Failed to fetch from Shutterstock");
  }

  const data = await response.json();

  // Transform Shutterstock response to match our Art type
  const arts: Art[] = data.data.map((item: any) => ({
    id: item.id,
    title: item.description,
    active: true,
    url: item.assets.preview.url,
    filename: `${item.id}.psd`,
    image: {
      type: item.media_type === "vector" ? "vector" : "photo",
      orientation: "square", // Shutterstock doesn't provide this directly
      source: {
        url: item.assets.preview.url,
        key: item.id.toString(),
        size: "preview",
      },
    },
  }));

  return { arts };
};
