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
      console.log("Cache hit for key:", cacheKey);
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
      console.error("Freepik API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        id: params.id,
      });

      throw new Error("Failed to fetch from Freepik");
    }

    const data = await response.json();
    console.log("Freepik API response for ID:", params.id, {
      hasData: !!data.data,
      hasPreview: !!data.data?.preview,
      previewUrl: data.data?.preview?.url,
    });

    if (!data.data?.preview?.url) {
      throw new Error("No preview URL in Freepik response");
    }

    const previewUrl = data.data.preview.url;

    // Verify the URL is valid
    try {
      new URL(previewUrl);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_: unknown) {
      console.error("Invalid preview URL:", previewUrl);
      throw new Error("Invalid preview URL");
    }

    // Cache the preview URL
    await redis.set(cacheKey, previewUrl, { ex: CACHE_TTL });

    return NextResponse.json({ url: previewUrl });
  } catch (error) {
    console.error("Error processing Freepik image:", {
      error,
      id: params.id,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    throw new Error("Internal server error");
  }
}
