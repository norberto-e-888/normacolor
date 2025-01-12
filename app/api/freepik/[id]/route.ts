import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const options: RequestInit = {
      method: "GET",
      headers: {
        "x-freepik-api-key": process.env.FREEPIK_API_KEY as string,
      },
    };

    const response = await fetch(
      `https://api.freepik.com/v1/resources/${params.id}/download/psd`,
      options
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from Freepik API");
    }

    const json = await response.json();
    return NextResponse.json({ url: json.data.url });
  } catch (error) {
    console.error("Error fetching Freepik image:", error);
    return new NextResponse("Failed to fetch image URL", { status: 500 });
  }
}
