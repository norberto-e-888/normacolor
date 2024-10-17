"use server";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { config } from "@/config";

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_SECRET_KEY,
  },
});

export const getUploadUrls = async () => {
  const readCommand = new GetObjectCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: "letterhead_21.psd",
  });

  const writeCommand = new PutObjectCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: "business-cards/5/front.psd",
  });

  const result = {
    read: await getSignedUrl(s3, readCommand, {
      expiresIn: 60 * 60,
    }),
    write: await getSignedUrl(s3, writeCommand, {
      expiresIn: 60 * 60,
    }),
  };

  console.log("URLs", result);

  return result;
};
