"use server";

import { Art } from "./fetch-arts";

export const fetchShutterstockArts = async ({
  term = "",
  dimensions = undefined,
}: {
  term?: string;
  dimensions?: [number, number];
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
    per_page: "20",
    sort: "popular",
  });

  // Add aspect ratio filter if dimensions are provided
  if (dimensions) {
    const [width, height] = dimensions;
    const aspectRatio = width / height;
    const tolerance = 0.1; // 10% tolerance for aspect ratio

    // Convert to pixels (assuming 300 DPI)
    const minWidth = Math.round(width * 300);
    const minHeight = Math.round(height * 300);

    params.append("aspect_ratio_min", (aspectRatio - tolerance).toString());
    params.append("aspect_ratio_max", (aspectRatio + tolerance).toString());
    params.append("width_from", minWidth.toString());
    params.append("height_from", minHeight.toString());
  }

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
      orientation: item.aspect || "square",
      source: {
        url: item.assets.preview.url,
        key: item.id.toString(),
        size: "preview",
      },
    },
  }));

  return { arts };
};
