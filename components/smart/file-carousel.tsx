import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Download,
  FileImage,
  FileText,
  Loader,
  Trash2,
} from "lucide-react";
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { toast } from "sonner";

import { ConfirmModal } from "@/components/ui/confirm-modal";
import { PusherEventName } from "@/constants/pusher";
import { ArtSource, NotificationType, Order, OrderStatus } from "@/database";
import { updateOrderStatus } from "@/functions/orders/update-order-status";
import { pusherClient } from "@/lib/client/pusher";
import { getPusherChannelName } from "@/utils/pusher";

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

interface OrderQueryData {
  selectedOrder?: Order<true>;
  [key: string]: unknown;
}

interface OrdersQueryData {
  orders: Order<true>[];
  nextCursor?: string | null;
  [key: string]: unknown;
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
      const queryClient = useQueryClient();
      const [deletingImageId, setDeletingImageId] = useState<string | null>(
        null
      );
      const [imageTypes, setImageTypes] = useState<Record<string, string>>({});
      const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
      const [approvingImageId, setApprovingImageId] = useState<string | null>(
        null
      );

      // Confirm modals state
      const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
      const [showApproveArtModal, setShowApproveArtModal] = useState(false);
      const [selectedImageForApproval, setSelectedImageForApproval] = useState<
        string | null
      >(null);

      // Check if this order item has an approved art
      const orderItem = order?.cart.find((item) => item.id === itemId);
      const approvedArtId = orderItem?.approvedArtId;

      // Sort images to show approved art first
      const sortedImages = [...images].sort((a, b) => {
        if (a === approvedArtId) return -1;
        if (b === approvedArtId) return 1;
        return 0;
      });

      // Subscribe to order status channel for real-time updates
      useEffect(() => {
        if (!order) return;

        const channelName = getPusherChannelName.orderStatus(order.id);
        const channel = pusherClient.subscribe(channelName);

        // Listen for order updates
        channel.bind(
          PusherEventName.OrderUpdated,
          (updatedOrder: Order<true>) => {
            // Update the order in the React Query cache
            queryClient.setQueryData<OrderQueryData>(
              ["order", order.id],
              (oldData) => {
                if (!oldData) return { selectedOrder: updatedOrder };
                return {
                  ...oldData,
                  selectedOrder: updatedOrder,
                };
              }
            );

            // Also update the orders list if it exists in the cache
            queryClient.setQueryData<OrdersQueryData>(["orders"], (oldData) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                orders: oldData.orders.map((o: Order<true>) =>
                  o.id === updatedOrder.id ? updatedOrder : o
                ),
              };
            });
          }
        );

        // Listen for art approval
        channel.bind(
          PusherEventName.ArtApproved,
          (data: { itemId: string; imageId: string; orderId: string }) => {
            if (data.itemId === itemId) {
              // Force refetch images to get the updated state
              onRefetchImages();
            }
          }
        );

        return () => {
          pusherClient.unsubscribe(channelName);
        };
      }, [order, itemId, queryClient, onRefetchImages]);

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

        // Only show modal if this is a freepik template and admin is uploading
        const hasFreepikItems = order.cart.some(
          (item) => item.art?.source === ArtSource.Freepik
        );

        if (
          isAdmin &&
          isDesignerImages &&
          hasFreepikItems &&
          order.status === OrderStatus.Paid
        ) {
          setShowUpdateStatusModal(true);
        }
      };

      const confirmUpdateToDesignApprovalPending = async () => {
        if (!order) return;

        setIsUpdatingStatus(true);
        try {
          // Update order status
          await updateOrderStatus(orderId, OrderStatus.DesignApprovalPending);

          // Create a notification for the client
          try {
            const response = await fetch(`/api/notifications`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: order.customerId,
                type: NotificationType.DesignApprovalPending,
                title: "Diseño listo para aprobación",
                message:
                  "Tu orden tiene un diseño listo para revisar y aprobar. Por favor, revisa y aprueba el diseño para continuar con la producción.",
                deepLink: `/ordenes?selectedId=${orderId}`,
                metadata: {
                  orderId,
                  itemId,
                },
              }),
            });

            if (!response.ok) {
              console.error(
                "Error creating notification:",
                await response.text()
              );
            }
          } catch (error) {
            console.error("Error creating client notification:", error);
            // Don't fail the main flow if this fails
          }

          toast.success("Orden actualizada a pendiente de aprobación");

          // Update the local query cache instead of refreshing
          queryClient.invalidateQueries({ queryKey: ["order", order.id] });
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        } catch (error) {
          console.error("Error updating order status:", error);
          toast.error("Error al actualizar el estado de la orden");
        } finally {
          setIsUpdatingStatus(false);
          setShowUpdateStatusModal(false);
        }
      };

      const handleApproveArtClick = async (imageId: string) => {
        if (!order || approvingImageId) return;

        setSelectedImageForApproval(imageId);
        setShowApproveArtModal(true);
      };

      const handleApproveArt = async () => {
        if (!order || !selectedImageForApproval) return;

        setApprovingImageId(selectedImageForApproval);
        try {
          const response = await fetch(
            `/api/orders/${orderId}/items/${itemId}/approve-art`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageId: selectedImageForApproval }),
            }
          );

          if (!response.ok) throw new Error("Failed to approve art");

          // Successful response received
          const data = await response.json();

          // Use React Query to update the cache with the updated order
          queryClient.setQueryData<OrderQueryData>(
            ["order", order.id],
            (oldData) => {
              if (!oldData) return { selectedOrder: data.updatedOrder };
              return {
                ...oldData,
                selectedOrder: data.updatedOrder,
              };
            }
          );

          // Invalidate the orders list to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ["orders"] });

          // Update the local image state
          await onRefetchImages();

          toast.success("Diseño aprobado correctamente");
        } catch (error) {
          console.error("Error approving art:", error);
          toast.error("Error al aprobar el diseño");
        } finally {
          setApprovingImageId(null);
          setSelectedImageForApproval(null);
          setShowApproveArtModal(false);
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
        <>
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
                          handleApproveArtClick(imageId);
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

          {/* Status Update Confirmation Modal */}
          <ConfirmModal
            isOpen={showUpdateStatusModal}
            onClose={() => setShowUpdateStatusModal(false)}
            onConfirm={confirmUpdateToDesignApprovalPending}
            title="Actualizar estado"
            description="¿Deseas marcar esta orden como pendiente de aprobación del diseño?"
            confirmLabel="Sí, continuar"
            cancelLabel="Cancelar"
            isLoading={isUpdatingStatus}
          />

          {/* Art Approval Confirmation Modal */}
          <ConfirmModal
            isOpen={showApproveArtModal}
            onClose={() => {
              setShowApproveArtModal(false);
              setSelectedImageForApproval(null);
            }}
            onConfirm={handleApproveArt}
            title="Aprobar diseño"
            description="Al aprobar este diseño, la orden pasará a producción. ¿Estás seguro que deseas aprobar este diseño?"
            confirmLabel="Aprobar diseño"
            cancelLabel="Cancelar"
            isLoading={!!approvingImageId}
          />
        </>
      );
    }
  )
);

FileCarousel.displayName = "FileCarousel";
