import { useQuery } from "@tanstack/react-query";
import { Download, Loader, Trash2 } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";

import { S3Image } from "./s3-image";

export const FileCarousel = memo(
  ({
    images,
    title,
    isDesignerImages,
    orderId,
    itemId,
    isAdmin,
    onRefetchImages,
  }: {
    images: string[];
    title: string;
    isDesignerImages: boolean;
    orderId: string;
    itemId: string;
    isAdmin: boolean;
    onRefetchImages: ReturnType<typeof useQuery>["refetch"];
  }) => {
    const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

    const handleDownload = async (imageId: string) => {
      try {
        const response = await fetch(
          `/api/orders/${orderId}/items/${itemId}/chat/images/${imageId}`
        );
        if (!response.ok) throw new Error("Failed to get download URL");
        const { url } = await response.json();
        const link = document.createElement("a");
        link.href = url;
        link.download = `design-${imageId}.psd`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Descarga iniciada");
      } catch (error) {
        console.error("Error downloading file:", error);
        toast.error("Error al descargar el archivo");
      }
    };

    const handleDelete = async (imageId: string) => {
      setDeletingImageId(imageId);
      try {
        const response = await fetch(
          `/api/orders/${orderId}/items/${itemId}/chat/images/${imageId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) throw new Error("Failed to delete image");

        await onRefetchImages();
        toast.success("Imagen eliminada exitosamente");
      } catch (error) {
        console.error("Error deleting image:", error);
        toast.error("Error al eliminar la imagen");
      } finally {
        setDeletingImageId(null);
      }
    };

    if (!images?.length) return null;

    return (
      <div className="mb-4">
        <h5 className="text-sm font-medium mb-2">{title}</h5>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((imageId) => (
            <div
              key={imageId}
              className="relative w-20 h-20 flex-shrink-0 border rounded-lg overflow-hidden group"
            >
              <S3Image s3Key={`chat/${itemId}/${imageId}/preview.png`} />
              <div className="absolute bottom-1 right-1 flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(imageId);
                  }}
                  className="p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                </button>
                {((isDesignerImages && isAdmin) ||
                  (!isDesignerImages && !isAdmin)) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(imageId);
                    }}
                    disabled={deletingImageId === imageId}
                    className="p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-red-500 disabled:opacity-50"
                  >
                    {deletingImageId === imageId ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

FileCarousel.displayName = "FileCarousel";
