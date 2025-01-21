import { NextResponse } from "next/server";

import { fetchShutterstockArts } from "@/functions/art/fetch-shutterstock-arts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term") || "";

  try {
    const { arts } = await fetchShutterstockArts({ term });
    return NextResponse.json({ arts });
  } catch (error) {
    console.error("Error fetching Shutterstock arts:", error);
    return new NextResponse("Failed to fetch arts", { status: 500 });
  }
}
