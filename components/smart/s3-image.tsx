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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchImageUrl = async () => {
      try {
        const response = await fetch(
          `/api/s3/${encodeURIComponent(
            imageId
          )}?namespace=${encodeURIComponent(namespace)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch image URL");
        }

        const data = await response.json();
        setImageUrl(data.url);
      } catch (err) {
        console.error(err, "Failed to load S3 image");
        setError(err instanceof Error ? err.message : "Failed to load image");
      } finally {
        setIsLoading(false);
      }
    };

    fetchImageUrl();
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

  return (
    <>
      <div
        className="w-full h-full cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative w-full h-full">
          <Image
            src={imageUrl}
            alt="Art preview"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
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
