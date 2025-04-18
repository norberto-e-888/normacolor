"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/modal";

export function S3Image({
  namespace,
  imageId,
}: {
  namespace: string;
  imageId: string;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchImageUrl = async () => {
      try {
        console.log(`Fetching image for ${namespace}/${imageId}`);
        const response = await fetch(
          `/api/s3/${encodeURIComponent(
            imageId
          )}?namespace=${encodeURIComponent(namespace)}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch image URL:", errorText);
          throw new Error(`Failed to fetch image: ${errorText}`);
        }

        const data = await response.json();
        console.log("S3 image data:", data);

        // If previewUrl exists, use it for display
        if (data.previewUrl) {
          setImageUrl(data.previewUrl);
          setOriginalUrl(data.url); // Keep the original URL for download/viewing
        } else {
          setImageUrl(data.url);
          setOriginalUrl(data.url);
        }

        if (data.fileType) {
          setFileType(data.fileType);
        }
      } catch (err) {
        console.error("Error loading S3 image:", err);
        setError(err instanceof Error ? err.message : "Failed to load image");
      } finally {
        setIsLoading(false);
      }
    };

    if (imageId) {
      fetchImageUrl();
    } else {
      setError("No image ID provided");
      setIsLoading(false);
    }
  }, [imageId, namespace]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm text-center p-2">
        {error || "Failed to load image"}
      </div>
    );
  }

  const handleImageClick = () => {
    // For PDF files, open in a new tab instead of modal
    if (fileType === "pdf" && originalUrl) {
      window.open(originalUrl, "_blank");
    } else {
      // For other file types, show modal
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="w-full h-full cursor-pointer" onClick={handleImageClick}>
        <div className="relative w-full h-full">
          {fileType === "pdf" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="48"
                height="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary mb-2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span className="text-sm text-muted-foreground">
                Click para abrir PDF
              </span>
            </div>
          ) : (
            <Image
              src={imageUrl}
              alt="Art preview"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="relative w-[80vw] h-[80vh]">
          <Image
            src={imageUrl}
            alt="Art preview"
            fill
            className="object-contain"
            sizes="80vw"
            priority
          />
        </div>
      </Modal>
    </>
  );
}
