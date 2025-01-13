import { NextResponse } from "next/server";

import { redis } from "@/lib/server/redis";

// Cache URLs for 24 hours
const CACHE_TTL = 24 * 60 * 60;

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    // Check Redis cache first
    const cacheKey = `freepik:preview:${params.id}`;
    const cachedUrl = await redis.get<string>(cacheKey);

    if (cachedUrl) {
      return NextResponse.json({ url: cachedUrl });
    }

    console.log("Cache miss for key:", cacheKey);

    // Fetch resource details from Freepik
    const response = await fetch(
      `https://api.freepik.com/v1/resources/${params.id}`,
      {
        headers: {
          "x-freepik-api-key": process.env.FREEPIK_API_KEY as string,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Freepik API error:", errorText);
      return new NextResponse("Failed to fetch from Freepik", { status: 502 });
    }

    const data = await response.json();
    const previewUrl = data.data.preview.url;

    console.log({ previewUrl });

    if (!previewUrl) {
      return new NextResponse("No preview URL in Freepik response", {
        status: 502,
      });
    }

    // Cache the preview URL
    await redis.set(cacheKey, previewUrl, { ex: CACHE_TTL });

    return NextResponse.json({ url: previewUrl });
  } catch (error) {
    console.error("Error processing Freepik image:", {
      error,
      params,
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
