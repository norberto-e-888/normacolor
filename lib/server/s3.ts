import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import os from "os";
import path from "path";
import PSD from "psd";

import { config } from "@/config";

export const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_SECRET_KEY,
  },
});

export async function getSignedUploadUrl(key: string, expiresIn = 3600) {
  const command = new PutObjectCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: key,
    ContentType: "application/octet-stream",
  });

  return getSignedUrl(s3, command, {
    expiresIn,
    // Remove signableHeaders to let SDK handle them automatically
  });
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

export async function uploadPSDWithPreview(
  psdBuffer: Uint8Array,
  folderKey: string
) {
  // Create temp file for PSD processing
  const tempDir = os.tmpdir();
  const tempPsdPath = path.join(tempDir, `${crypto.randomUUID()}.psd`);
  const tempPngPath = path.join(tempDir, `${crypto.randomUUID()}.png`);

  try {
    // Write PSD to temp file
    await fs.writeFile(tempPsdPath, new Uint8Array(psdBuffer));

    // Open PSD and convert to PNG
    const psd = await PSD.open(tempPsdPath);
    if (!psd.image) {
      throw new Error("PSD file has no image data");
    }
    await psd.image.saveAsPng(tempPngPath);

    // Read PNG file
    const pngBuffer = await fs.readFile(tempPngPath);

    // Upload both files to S3
    const psdKey = `${folderKey}/original.psd`;
    const pngKey = `${folderKey}/preview.png`;

    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: config.AWS_BUCKET_NAME,
          Key: psdKey,
          Body: psdBuffer,
          ContentType: "application/octet-stream",
        })
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: config.AWS_BUCKET_NAME,
          Key: pngKey,
          Body: pngBuffer,
          ContentType: "image/png",
        })
      ),
    ]);

    return {
      psdKey,
      pngKey,
    };
  } finally {
    // Clean up temp files
    await Promise.all([
      fs.unlink(tempPsdPath).catch(() => {}),
      fs.unlink(tempPngPath).catch(() => {}),
    ]);
  }
}

export async function uploadToS3(s3Key: string, Body: Buffer) {
  const command = new PutObjectCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: s3Key,
    Body,
    ContentType: "image/png",
  });

  return s3.send(command);
}
