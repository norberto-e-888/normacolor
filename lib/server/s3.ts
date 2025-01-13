import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
  });
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}
