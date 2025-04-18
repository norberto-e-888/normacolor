import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { fromBuffer } from "pdf2pic";
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
  });
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

export async function deleteS3Object(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: key,
  });

  return s3.send(command);
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

// Function to handle PDF uploads with a preview image
export async function uploadPDFWithPreview(
  pdfBuffer: Uint8Array,
  folderKey: string
) {
  // Create temp files for PDF processing
  const tempDir = os.tmpdir();
  const tempPdfPath = path.join(tempDir, `${crypto.randomUUID()}.pdf`);
  const tempPngPath = path.join(tempDir, `${crypto.randomUUID()}.png`);

  try {
    // Write PDF to temp file
    await fs.writeFile(tempPdfPath, pdfBuffer);

    // Load the PDF document to check page count
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    if (pageCount === 0) {
      throw new Error("PDF file has no pages");
    }

    // Configure pdf2pic options
    const options = {
      density: 300,
      saveFilename: path.basename(tempPngPath, ".png"),
      savePath: path.dirname(tempPngPath),
      format: "png",
      width: 800,
      height: 800,
    };

    // Convert first page of PDF to PNG
    const convert = fromBuffer(Buffer.from(pdfBuffer), options);
    const pageData = await convert(1); // Convert first page only

    // Get the PNG buffer
    let pngBuffer;
    if (pageData && pageData.path) {
      pngBuffer = await fs.readFile(pageData.path);
    } else {
      // If conversion fails, use a default PDF icon
      const pdfIconBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAA7EAAAOxAGVKw4bAAADuElEQVR4nO3dT0jTcRzH8c/v59xmOgKjP1AYFgmFHaJDSRAd6hBBHTp0CTp07RZ0EzoVdYo6RASdOnUoOkRQRAcPQUsqKAzMiiBbS9wfy7mfh99IKNP5c7t8t9f7dRTZ+H0f+PL9rTkzEwAAAAAA8nj+AYs1aFEnxVKr1aJOiuVWs/U/AGEIQBgCEIYAhCEAYQhAGAIQhgCEIQBhCEAYAhCGAIQhAGEIQBgCEIYAhCEAYQhAGAIQhgCEIQBhCEAYAhCGAIQhAGEIQBgCEIYAhCEAYQhAGAIQhgCEIQBhCEAYAhCGAIQhAGEIQJhf7wfIFUt6MvXD+buCrK+vS+eSh9NrJ7/O6MH7KdcxsuIfdFV7I+F0qMmZeV25N+o6RlYOdd7W4JVTzmNksqVsLu88xpbtuzTw8rbrGJvwbwDCEIAwBCAMAQhDAMIQgDAEIAwBCEMAwkQdwEQmoZZQYP3nXnTXBJrXUPNq14vPmE041jSSL1U6W0d1kL+5EHUARzvqdLwtuf7zYMu2QPN2VlW6XnzGXK84pYrVV1XaUsVgRv9F1AEguwhAGAIQhgCEIQBhCEAYAhCGAIQhAGFuPf2ilh2R9Z9bmisCzSsWy64XnzGNkb3q7Iwqk6jXeKZP8zPvdLbvtvM8UQdwqGXrhs9vns4FmlfIVbhefMZcunDJdYQ/bOvupRf9l1zH2IT/BAhDAMIQgDAEIAwBCEMAwqIOoL5mhxqSez1MLDZ3VNcEnhM13vwkjZ7vdh0jK8lgjx7fveY6xpZEHUC5XNZcOqWxr5+dzI+E63Uyccidzxf15uOUk9nZGnnxSNPzryMZFXUAkvRtdl5X708qly9EOrep7oCSe3ojnRmVp8/u6ez1gUjnRh1AxeP3GfX2j6g75e4p15LwqfnwST25fcPZ/Ci04ofV35FyHSMrqZ8L+jWXdh1jS8y+z0nS9EJOvwsFV+N9kdwV+xN7AAAAAACAfwGFEA+P1wu1VAAAAABJRU5ErkJggg==";
      pngBuffer = Buffer.from(pdfIconBase64, "base64");
    }

    // Upload both files to S3
    const pdfKey = `${folderKey}/original.pdf`;
    const pngKey = `${folderKey}/preview.png`;

    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: config.AWS_BUCKET_NAME,
          Key: pdfKey,
          Body: pdfBuffer,
          ContentType: "application/pdf",
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
      pdfKey,
      pngKey,
    };
  } catch (error) {
    console.error("Error processing PDF:", error);

    // Fall back to a PDF icon if the conversion fails
    const pdfIconBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAA7EAAAOxAGVKw4bAAADuElEQVR4nO3dT0jTcRzH8c/v59xmOgKjP1AYFgmFHaJDSRAd6hBBHTp0CTp07RZ0EzoVdYo6RASdOnUoOkRQRAcPQUsqKAzMiiBbS9wfy7mfh99IKNP5c7t8t9f7dRTZ+H0f+PL9rTkzEwAAAAAA8nj+AYs1aFEnxVKr1aJOiuVWs/U/AGEIQBgCEIYAhCEAYQhAGAIQhgCEIQBhCEAYAhCGAIQhAGEIQBgCEIYAhCEAYQhAGAIQhgCEIQBhCEAYAhCGAIQhAGEIQBgCEIYAhCEAYQhAGAIQhgCEIQBhCEAYAhCGAIQhAGEIQJhf7wfIFUt6MvXD+buCrK+vS+eSh9NrJ7/O6MH7KdcxsuIfdFV7I+F0qMmZeV25N+o6RlYOdd7W4JVTzmNksqVsLu88xpbtuzTw8rbrGJvwbwDCEIAwBCAMAQhDAMIQgDAEIAwBCEMAwkQdwEQmoZZQYP3nXnTXBJrXUPNq14vPmE041jSSL1U6W0d1kL+5EHUARzvqdLwtuf7zYMu2QPN2VlW6XnzGXK84pYrVV1XaUsVgRv9F1AEguwhAGAIQhgCEIQBhCEAYAhCGAIQhAGFuPf2ilh2R9Z9bmisCzSsWy64XnzGNkb3q7Iwqk6jXeKZP8zPvdLbvtvM8UQdwqGXrhs9vns4FmlfIVbhefMZcunDJdYQ/bOvupRf9l1zH2IT/BAhDAMIQgDAEIAwBCEMAwqIOoL5mhxqSez1MLDZ3VNcEnhM13vwkjZ7vdh0jK8lgjx7fveY6xpZEHUC5XNZcOqWxr5+dzI+E63Uyccidzxf15uOUk9nZGnnxSNPzryMZFXUAkvRtdl5X708qly9EOrep7oCSe3ojnRmVp8/u6ez1gUjnRh1AxeP3GfX2j6g75e4p15LwqfnwST25fcPZ/Ci04ofV35FyHSMrqZ8L+jWXdh1jS8y+z0nS9EJOvwsFV+N9kdwV+xN7AAAAAACAfwGFEA+P1wu1VAAAAABJRU5ErkJggg==";

    // Upload original PDF and a fallback icon
    const pdfKey = `${folderKey}/original.pdf`;
    const pngKey = `${folderKey}/preview.png`;

    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: config.AWS_BUCKET_NAME,
          Key: pdfKey,
          Body: pdfBuffer,
          ContentType: "application/pdf",
        })
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: config.AWS_BUCKET_NAME,
          Key: pngKey,
          Body: Buffer.from(pdfIconBase64, "base64"),
          ContentType: "image/png",
        })
      ),
    ]);

    return {
      pdfKey,
      pngKey,
    };
  } finally {
    // Clean up temp files
    await Promise.all([
      fs.unlink(tempPdfPath).catch(() => {}),
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
