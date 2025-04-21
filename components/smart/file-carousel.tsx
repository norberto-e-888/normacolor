import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Download,
  FileImage,
  FileText,
  Loader,
  Trash2,
} from "lucide-react";
import { forwardRef, memo, useImperativeHandle, useState } from "react";
import { toast } from "sonner";

import { ArtSource, Order, OrderStatus } from "@/database";
import { updateOrderStatus } from "@/functions/orders/update-order-status";

import { S3Image } from "./s3-image";

interface FileCarouselProps {
  images: string[];
  title: string;
  isDesignerImages: boolean;
  orderId: string;
  itemId: string;
  isAdmin: boolean;
  onRefetchImages: ReturnType<typeof useQuery>["refetch"];
  order?: Order<true>;
}

export interface FileCarouselRef {
  handleUpdateToDesignApprovalPending: () => Promise<void>;
}

export const FileCarousel = memo(
  forwardRef<FileCarouselRef, FileCarouselProps>(
    (
      {
        images,
        title,
        isDesignerImages,
        orderId,
        itemId,
        isAdmin,
        onRefetchImages,
        order,
      },
      ref
    ) => {
      const [deletingImageId, setDeletingImageId] = useState<string | null>(
        null
      );
      const [imageTypes, setImageTypes] = useState<Record<string, string>>({});
      const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
      const [approvingImageId, setApprovingImageId] = useState<string | null>(
        null
      );

      // Check if this order item has an approved art
      const orderItem = order?.cart.find((item) => item.id === itemId);
      const approvedArtId = orderItem?.approvedArtId;

      // Sort images to show approved art first
      const sortedImages = [...images].sort((a, b) => {
        if (a === approvedArtId) return -1;
        if (b === approvedArtId) return 1;
        return 0;
      });

      const handleDownload = async (imageId: string) => {
        try {
          const response = await fetch(
            `/api/orders/${orderId}/items/${itemId}/chat/images/${imageId}`
          );
          if (!response.ok) throw new Error("Failed to get download URL");
          const { url, fileType } = await response.json();

          // Save the file type for later use (like showing icons)
          setImageTypes((prev) => ({ ...prev, [imageId]: fileType }));

          const link = document.createElement("a");
          link.href = url;

          // Set appropriate file extension based on the file type
          const fileExtension = fileType || "unknown";
          link.download = `design-${imageId}.${fileExtension}`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success("Descarga iniciada");
        } catch (error) {
          console.error("Error downloading file:", error);
          toast.error("Error al descargar el archivo");
        }
      };

      const handleUpdateToDesignApprovalPending = async () => {
        if (!order || isUpdatingStatus) return;

        // Only prompt to update status if this is a freepik template and admin is uploading
        const hasFreepikItems = order.cart.some(
          (item) => item.art?.source === ArtSource.Freepik
        );

        if (
          isAdmin &&
          isDesignerImages &&
          hasFreepikItems &&
          order.status === OrderStatus.Paid
        ) {
          const shouldSetPending = confirm(
            "¿Deseas marcar esta orden como pendiente de aprobación del diseño?"
          );

          if (shouldSetPending) {
            setIsUpdatingStatus(true);
            try {
              await updateOrderStatus(
                orderId,
                OrderStatus.DesignApprovalPending
              );
              toast.success("Orden actualizada a pendiente de aprobación");
              // Force reload the page to refresh the order status
              window.location.reload();
            } catch (error) {
              console.error("Error updating order status:", error);
              toast.error("Error al actualizar el estado de la orden");
            } finally {
              setIsUpdatingStatus(false);
            }
          }
        }
      };

      const handleApproveArt = async (imageId: string) => {
        if (!order || approvingImageId) return;

        setApprovingImageId(imageId);
        try {
          const response = await fetch(
            `/api/orders/${orderId}/items/${itemId}/approve-art`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageId }),
            }
          );

          if (!response.ok) throw new Error("Failed to approve art");

          // Successful response received
          await response.json();

          toast.success("Diseño aprobado correctamente");

          // Force reload the page to refresh the order status
          window.location.reload();
        } catch (error) {
          console.error("Error approving art:", error);
          toast.error("Error al aprobar el diseño");
        } finally {
          setApprovingImageId(null);
        }
      };

      useImperativeHandle(ref, () => ({
        handleUpdateToDesignApprovalPending,
      }));

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

      // Function to render the appropriate file type icon
      const renderFileTypeIcon = (imageId: string) => {
        const fileType = imageTypes[imageId];

        // If we don't know the type yet, don't show a special icon
        if (!fileType) return null;

        // For PDF files, show a document icon
        if (fileType === "pdf") {
          return (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-100 opacity-70">
              <FileText className="w-8 h-8 text-gray-500" />
            </div>
          );
        }

        // For AI files, show a vector icon
        if (fileType === "ai") {
          return (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-100 opacity-70">
              <FileImage className="w-8 h-8 text-gray-500" />
            </div>
          );
        }

        return null;
      };

      // Show an approval button when:
      // 1. These are designer images
      // 2. The user is a client (not admin)
      // 3. The order is in DesignApprovalPending state
      const showApproveButton =
        isDesignerImages &&
        !isAdmin &&
        order?.status === OrderStatus.DesignApprovalPending;

      // Show the approved indicator when:
      // 1. We have an approved art ID
      // 2. And it matches this image
      const isApproved = (imageId: string) => approvedArtId === imageId;

      if (!images?.length) return null;

      return (
        <div className="mb-4">
          <h5 className="text-sm font-medium mb-2">{title}</h5>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sortedImages.map((imageId) => (
              <div
                key={imageId}
                className={`relative w-20 h-20 flex-shrink-0 border rounded-lg overflow-hidden group 
                  ${
                    isApproved(imageId)
                      ? "border-green-500 border-2 shadow-md"
                      : ""
                  }`}
              >
                <S3Image
                  namespace={`order-chats/${orderId}/${itemId}`}
                  imageId={imageId}
                />
                {renderFileTypeIcon(imageId)}

                {/* Approved check mark */}
                {isApproved(imageId) && (
                  <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                <div className="absolute bottom-1 right-1 flex gap-1">
                  {/* Download button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(imageId);
                    }}
                    className="p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Approve button */}
                  {showApproveButton && !isApproved(imageId) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApproveArt(imageId);
                      }}
                      disabled={approvingImageId === imageId}
                      className="p-1 bg-green-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-white disabled:opacity-50"
                    >
                      {approvingImageId === imageId ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {/* Delete button */}
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
  )
);

FileCarousel.displayName = "FileCarousel";
