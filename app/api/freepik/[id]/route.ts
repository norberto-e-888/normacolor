import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import { NextResponse } from "next/server";
import os from "os";
import path from "path";
import PSD from "psd";
import { v4 as uuid } from "uuid";

import { config } from "@/config";
import { redis } from "@/lib/server/redis";

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_SECRET_KEY,
  },
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check Redis cache first
    const cacheKey = `freepik:image:${params.id}`;
    const cachedS3Key = await redis.get<string>(cacheKey);

    if (cachedS3Key) {
      console.log("Cache hit for key:", cacheKey);
      // Generate fresh signed URL for cached S3 object
      const getCommand = new GetObjectCommand({
        Bucket: config.AWS_BUCKET_NAME,
        Key: cachedS3Key,
      });

      const signedUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });
      return NextResponse.json({ url: signedUrl });
    }

    console.log("Cache miss for key:", cacheKey);

    // Fetch from Freepik if not cached
    const options: RequestInit = {
      method: "GET",
      headers: {
        "x-freepik-api-key": process.env.FREEPIK_API_KEY as string,
      },
    };

    console.log("Fetching from Freepik API for id:", params.id);
    const response = await fetch(
      `https://api.freepik.com/v1/resources/${params.id}/download/psd`,
      options
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Freepik API error:", errorText);
      return new NextResponse("Failed to fetch from Freepik", { status: 502 });
    }

    const body = await response.json();
    console.log(body, "Freepik API response");
    const psdUrl = body.data[0]?.url;

    // Download the PSD file
    const psdResponse = await fetch(psdUrl);
    if (!psdResponse.ok) {
      console.error(`Failed to download PSD from Freepik for id: ${params.id}`);
      return new NextResponse("Failed to download PSD", { status: 502 });
    }

    // Create temp file path
    const tempDir = os.tmpdir();
    const tempPsdPath = path.join(tempDir, `${uuid()}.psd`);
    const tempPngPath = path.join(tempDir, `${uuid()}.png`);

    // Save PSD to temp file
    const arrayBuffer = await psdResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await fs.writeFile(tempPsdPath, uint8Array);

    // Open PSD and convert to PNG
    const psd = await PSD.open(tempPsdPath);

    if (!psd.image) {
      console.error("PSD file has no image data");
      return new NextResponse("PSD file has no image data", { status: 502 });
    }

    await psd.image.saveAsPng(tempPngPath);

    // Read PNG file
    const pngBuffer = await fs.readFile(tempPngPath);

    // Clean up temp files
    await Promise.all([fs.unlink(tempPsdPath), fs.unlink(tempPngPath)]);

    // Upload to S3
    const s3Key = `freepik/${params.id}/${uuid()}.png`;
    const putCommand = new PutObjectCommand({
      Bucket: config.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: pngBuffer,
      ContentType: "image/png",
    });

    await s3.send(putCommand);

    // Cache the S3 key
    await redis.set(cacheKey, s3Key);

    // Generate signed URL for the uploaded object
    const getCommand = new GetObjectCommand({
      Bucket: config.AWS_BUCKET_NAME,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("Error processing Freepik image:", {
      error,
      params,
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
