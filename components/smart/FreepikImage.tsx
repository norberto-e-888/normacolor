"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function FreepikImage({ id }: { id: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImageUrl = async () => {
      try {
        const response = await fetch(`/api/freepik/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch image URL");
        }
        const data = await response.json();
        setImageUrl(data.url);
      } catch (err) {
        console.error(err, "Failed to load Freepik image");
        setError(err instanceof Error ? err.message : "Failed to load image");
      } finally {
        setIsLoading(false);
      }
    };

    fetchImageUrl();
  }, [id]);

  if (isLoading) {
    return (
      <div className="w-32 h-32 flex items-center justify-center bg-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-32 h-32 flex items-center justify-center bg-muted text-muted-foreground text-sm text-center p-2">
        {error || "Failed to load image"}
      </div>
    );
  }

  return (
    <div className="relative w-32 h-32">
      <Image
        src={imageUrl}
        alt="Art preview"
        fill
        className="object-contain"
        sizes="(max-width: 768px) 128px, 128px"
        priority
      />
    </div>
  );
}
